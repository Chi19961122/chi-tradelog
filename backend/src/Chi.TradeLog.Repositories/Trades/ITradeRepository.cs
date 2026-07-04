using Chi.TradeLog.Common.Models.Conditions;
using Chi.TradeLog.Common.Models.DataModels;

namespace Chi.TradeLog.Repositories.Trades;

/// <summary>
/// 交易資料存取層（Repository）。
/// </summary>
public interface ITradeRepository
{
    /// <summary>
    /// 依帳戶查詢交易，依交易日期由新到舊排序。
    /// </summary>
    Task<IReadOnlyList<TradeDataModel>> GetByAccountsAsync(
        TradeQueryCondition condition,
        CancellationToken cancellationToken = default);
}
