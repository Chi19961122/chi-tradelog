using Chi.TradeLog.Common.Models.DataModels;

namespace Chi.TradeLog.Repositories.Journal;

/// <summary>
/// 交易日記資料存取層（Repository）。所有操作皆以使用者為範圍（多租戶隔離）。
/// </summary>
public interface IJournalRepository
{
    /// <summary>
    /// 依使用者/帳戶/商品/日期取得日記；找不到時回傳 <c>null</c>。
    /// </summary>
    Task<JournalEntryDataModel?> GetAsync(
        long userId, string accountId, string symbol, int day, CancellationToken cancellationToken = default);

    /// <summary>
    /// 新增或更新日記（以使用者/帳戶/商品/日期為唯一鍵 upsert）。
    /// </summary>
    Task UpsertAsync(JournalEntryDataModel entry, CancellationToken cancellationToken = default);
}
