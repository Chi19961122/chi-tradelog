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
}
