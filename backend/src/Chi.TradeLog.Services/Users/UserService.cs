using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Common.Models.Dtos;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Repositories.Users;

namespace Chi.TradeLog.Services.Users;

/// <summary>
/// 使用者管理 Service 實作。密碼一律以 BCrypt 雜湊儲存。
/// </summary>
public class UserService : IUserService
{
    /// <summary>
    /// 系統預設密碼（管理員建立帳號或重設密碼時使用；使用者可自行變更）。
    /// </summary>
    public const string DefaultPassword = "changeme123";

    private readonly IUserRepository _userRepository;

    /// <summary>
    /// 建立使用者管理 Service。
    /// </summary>
    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    /// <summary>
    /// 取得所有使用者摘要。
    /// </summary>
    public async Task<IReadOnlyList<UserSummaryDto>> ListAsync(CancellationToken cancellationToken = default)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        return users.Select(ToSummary).ToList();
    }

    /// <summary>
    /// 建立使用者（未指定密碼時使用預設）；電子郵件已存在時回傳 <c>null</c>。
    /// </summary>
    public async Task<CreateUserResultDto?> CreateAsync(CreateUserInfo info, CancellationToken cancellationToken = default)
    {
        var email = info.Email.Trim().ToLowerInvariant();
        if (await _userRepository.ExistsByEmailAsync(email, cancellationToken))
        {
            return null;
        }

        var password = string.IsNullOrWhiteSpace(info.Password) ? DefaultPassword : info.Password;
        var user = new UserDataModel
        {
            Email = email,
            DisplayName = info.Name.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            IsAdmin = false,
        };
        user.Id = await _userRepository.InsertAsync(user, cancellationToken);

        return new CreateUserResultDto { User = ToSummary(user), TemporaryPassword = password };
    }

    /// <summary>
    /// 將指定使用者密碼重設為預設，回傳該預設密碼；找不到時回傳 <c>null</c>。
    /// </summary>
    public async Task<string?> ResetPasswordAsync(long id, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(id, cancellationToken);
        if (user is null)
        {
            return null;
        }

        await _userRepository.UpdatePasswordAsync(id, BCrypt.Net.BCrypt.HashPassword(DefaultPassword), cancellationToken);
        return DefaultPassword;
    }

    /// <summary>
    /// 由本人變更密碼：驗證目前密碼後更新；成功回傳 <c>true</c>。
    /// </summary>
    public async Task<bool> ChangePasswordAsync(ChangePasswordInfo info, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(info.Email.Trim().ToLowerInvariant(), cancellationToken);
        if (user is null || BCrypt.Net.BCrypt.Verify(info.CurrentPassword, user.PasswordHash) is false)
        {
            return false;
        }

        await _userRepository.UpdatePasswordAsync(user.Id, BCrypt.Net.BCrypt.HashPassword(info.NewPassword), cancellationToken);
        return true;
    }

    /// <summary>
    /// 由 DataModel 轉為摘要 Dto。
    /// </summary>
    private static UserSummaryDto ToSummary(UserDataModel user) => new()
    {
        Id = user.Id,
        Name = user.DisplayName,
        Email = user.Email,
        IsAdmin = user.IsAdmin,
    };
}
