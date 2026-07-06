using Chi.TradeLog.Common.Models.DataModels;

namespace Chi.TradeLog.Repositories.Users;

/// <summary>
/// 使用者資料存取層（Repository）。
/// </summary>
public interface IUserRepository
{
    /// <summary>
    /// 依電子郵件取得使用者；找不到時回傳 <c>null</c>。
    /// </summary>
    Task<UserDataModel?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>
    /// 依主鍵取得使用者；找不到時回傳 <c>null</c>。
    /// </summary>
    Task<UserDataModel?> GetByIdAsync(long id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得所有使用者，依名稱排序。
    /// </summary>
    Task<IReadOnlyList<UserDataModel>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 判斷電子郵件是否已被使用。
    /// </summary>
    Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>
    /// 新增使用者，回傳新產生的主鍵。
    /// </summary>
    Task<long> InsertAsync(UserDataModel user, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新指定使用者的密碼雜湊，回傳受影響列數。
    /// </summary>
    Task<int> UpdatePasswordAsync(long id, string passwordHash, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新指定使用者的基本資料（email／名稱／管理員旗標），回傳受影響列數。
    /// </summary>
    Task<int> UpdateProfileAsync(
        long id, string email, string displayName, bool isAdmin, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除指定使用者（其所有資料由外鍵串接刪除），回傳受影響列數。
    /// </summary>
    Task<int> DeleteAsync(long id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得管理員人數。
    /// </summary>
    Task<int> CountAdminsAsync(CancellationToken cancellationToken = default);
}
