using Chi.TradeLog.Common.Models.DataModels;

namespace Chi.TradeLog.Repositories.Journal;

/// <summary>
/// 交易日記資料存取層（Repository）。
/// </summary>
public interface IJournalRepository
{
    /// <summary>
    /// 依帳戶/商品/日期取得日記；找不到時回傳 <c>null</c>。
    /// </summary>
    Task<JournalEntryDataModel?> GetAsync(
        string accountId, string symbol, int day, CancellationToken cancellationToken = default);

    /// <summary>
    /// 新增或更新日記（以帳戶/商品/日期為唯一鍵 upsert）。
    /// </summary>
    Task UpsertAsync(JournalEntryDataModel entry, CancellationToken cancellationToken = default);
}
