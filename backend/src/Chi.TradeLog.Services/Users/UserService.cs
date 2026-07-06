using Chi.TradeLog.Common.Enums;
using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Common.Models.Dtos;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Repositories.Settings;
using Chi.TradeLog.Repositories.Users;

namespace Chi.TradeLog.Services.Users;

/// <summary>
/// 使用者管理 Service 實作。密碼一律以 BCrypt 雜湊儲存；
/// 建立使用者時一併植入預設商品/標籤，讓新使用者的下拉選單不為空。
/// </summary>
public class UserService : IUserService
{
    /// <summary>
    /// 系統預設密碼（管理員建立帳號或重設密碼時使用；使用者可自行變更）。
    /// </summary>
    public const string DefaultPassword = "changeme123";

    // 新使用者的預設商品/標籤（與 migration 0004 的種子一致）。
    private static readonly string[] DefaultSymbols =
        ["AAPL", "TSLA", "NVDA", "MSFT", "QQQ", "AMD", "META", "AMZN", "SPY", "COIN", "NFLX", "GOOGL"];

    private static readonly string[] DefaultTags =
        ["breakout", "earnings", "reversal", "trend", "news", "gap", "manual"];

    private readonly IUserRepository _userRepository;
    private readonly ISettingsRepository _settingsRepository;

    /// <summary>
    /// 建立使用者管理 Service。
    /// </summary>
    public UserService(IUserRepository userRepository, ISettingsRepository settingsRepository)
    {
        _userRepository = userRepository;
        _settingsRepository = settingsRepository;
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

        // 植入預設商品與標籤，讓新使用者的新增交易下拉選單有內容可選。
        foreach (var symbol in DefaultSymbols)
        {
            await _settingsRepository.InsertSymbolAsync(user.Id, symbol, cancellationToken);
        }
        foreach (var tag in DefaultTags)
        {
            await _settingsRepository.InsertTagAsync(user.Id, tag, cancellationToken);
        }

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
    /// 更新使用者基本資料（名稱／email／管理員旗標）。
    /// 電子郵件重複或會使系統失去最後一位管理員時拒絕。
    /// </summary>
    public async Task<UserMutationResult> UpdateAsync(long id, UpdateUserInfo info, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(id, cancellationToken);
        if (user is null)
        {
            return UserMutationResult.NotFound;
        }

        var email = info.Email.Trim().ToLowerInvariant();
        if (email != user.Email && await _userRepository.ExistsByEmailAsync(email, cancellationToken))
        {
            return UserMutationResult.EmailConflict;
        }

        // 降權保護：不可讓系統失去最後一位管理員。
        if (user.IsAdmin && info.IsAdmin is false
            && await _userRepository.CountAdminsAsync(cancellationToken) <= 1)
        {
            return UserMutationResult.LastAdminBlocked;
        }

        await _userRepository.UpdateProfileAsync(id, email, info.Name.Trim(), info.IsAdmin, cancellationToken);
        return UserMutationResult.Ok;
    }

    /// <summary>
    /// 由本人更新自己的個人檔案（顯示名稱／電子郵件）。
    /// 管理員旗標沿用原值（本人不得自改權限）；電子郵件重複時拒絕。
    /// </summary>
    public async Task<UserMutationResult> UpdateOwnProfileAsync(
        string currentEmail, string name, string newEmail, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(currentEmail.Trim().ToLowerInvariant(), cancellationToken);
        if (user is null)
        {
            return UserMutationResult.NotFound;
        }

        var email = newEmail.Trim().ToLowerInvariant();
        if (email != user.Email && await _userRepository.ExistsByEmailAsync(email, cancellationToken))
        {
            return UserMutationResult.EmailConflict;
        }

        await _userRepository.UpdateProfileAsync(user.Id, email, name.Trim(), user.IsAdmin, cancellationToken);
        return UserMutationResult.Ok;
    }

    /// <summary>
    /// 刪除使用者（其所有資料由外鍵串接刪除）；會使系統失去最後一位管理員時拒絕。
    /// </summary>
    public async Task<UserMutationResult> DeleteAsync(long id, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(id, cancellationToken);
        if (user is null)
        {
            return UserMutationResult.NotFound;
        }

        if (user.IsAdmin && await _userRepository.CountAdminsAsync(cancellationToken) <= 1)
        {
            return UserMutationResult.LastAdminBlocked;
        }

        await _userRepository.DeleteAsync(id, cancellationToken);
        return UserMutationResult.Ok;
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
