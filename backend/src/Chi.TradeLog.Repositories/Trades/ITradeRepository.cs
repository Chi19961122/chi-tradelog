using Chi.TradeLog.Common.Models.Conditions;
using Chi.TradeLog.Common.Models.DataModels;

namespace Chi.TradeLog.Repositories.Trades;

/// <summary>
/// 交易資料存取層（Repository）。所有操作皆以使用者為範圍（多租戶隔離）。
/// </summary>
public interface ITradeRepository
{
    /// <summary>
    /// 依使用者與帳戶查詢交易，依交易日期由新到舊排序。
    /// </summary>
    Task<IReadOnlyList<TradeDataModel>> GetByAccountsAsync(
        TradeQueryCondition condition,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 新增一筆交易（含 user_id），回傳新產生的主鍵。
    /// </summary>
    Task<long> InsertAsync(TradeDataModel trade, CancellationToken cancellationToken = default);

    /// <summary>
    /// 於單一交易（transaction）中批次新增多筆交易，回傳新增筆數。
    /// </summary>
    Task<int> InsertManyAsync(IReadOnlyList<TradeDataModel> trades, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新指定交易（僅限資料所屬使用者），回傳受影響的列數。
    /// </summary>
    Task<int> UpdateAsync(TradeDataModel trade, CancellationToken cancellationToken = default);

    /// <summary>
    /// 依主鍵取得指定使用者的單筆交易；找不到時回傳 <c>null</c>。
    /// </summary>
    Task<TradeDataModel?> GetByIdAsync(long id, long userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除指定使用者的指定交易，回傳受影響的列數。
    /// </summary>
    Task<int> DeleteAsync(long id, long userId, CancellationToken cancellationToken = default);
}
