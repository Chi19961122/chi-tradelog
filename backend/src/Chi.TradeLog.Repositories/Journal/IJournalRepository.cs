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
        long userId, string accountId, string symbol, DateOnly date, CancellationToken cancellationToken = default);

    /// <summary>
    /// 新增或更新日記（以使用者/帳戶/商品/日期為唯一鍵 upsert）。
    /// </summary>
    Task UpsertAsync(JournalEntryDataModel entry, CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得指定使用者的全部日記。<paramref name="includeNotes"/> 為 <c>false</c> 時
    /// notes 固定回空字串（行為分析聚合用；notes 含截圖 data URL 可能很大）。
    /// </summary>
    Task<IReadOnlyList<JournalEntryDataModel>> GetAllByUserAsync(
        long userId, bool includeNotes = false, CancellationToken cancellationToken = default);
}
