using Chi.TradeLog.Common.Enums;
using Chi.TradeLog.Common.Models.Dtos;
using Chi.TradeLog.Common.Models.InfoModels;

namespace Chi.TradeLog.Services.Users;

/// <summary>
/// 使用者管理業務邏輯層（Service）。
/// </summary>
public interface IUserService
{
    /// <summary>
    /// 取得所有使用者摘要（管理員用）。
    /// </summary>
    Task<IReadOnlyList<UserSummaryDto>> ListAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 建立使用者（未指定密碼時使用系統預設）；電子郵件已存在時回傳 <c>null</c>。
    /// </summary>
    Task<CreateUserResultDto?> CreateAsync(CreateUserInfo info, CancellationToken cancellationToken = default);

    /// <summary>
    /// 將指定使用者的密碼重設為系統預設，回傳該預設密碼；找不到時回傳 <c>null</c>。
    /// </summary>
    Task<string?> ResetPasswordAsync(long id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 由使用者本人變更密碼（需驗證目前密碼）；成功回傳 <c>true</c>。
    /// </summary>
    Task<bool> ChangePasswordAsync(ChangePasswordInfo info, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新使用者基本資料（名稱／email／管理員旗標），回傳結果代碼。
    /// </summary>
    Task<UserMutationResult> UpdateAsync(long id, UpdateUserInfo info, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除使用者（其所有資料由外鍵串接刪除），回傳結果代碼。
    /// </summary>
    Task<UserMutationResult> DeleteAsync(long id, CancellationToken cancellationToken = default);
}
