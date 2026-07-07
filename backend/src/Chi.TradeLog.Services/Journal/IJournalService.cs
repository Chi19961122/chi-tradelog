using Chi.TradeLog.Common.Models.Dtos;
using Chi.TradeLog.Common.Models.InfoModels;

namespace Chi.TradeLog.Services.Journal;

/// <summary>
/// 交易日記業務邏輯層（Service）。
/// </summary>
public interface IJournalService
{
    /// <summary>
    /// 依使用者/帳戶/商品/日期取得日記；找不到時回傳 <c>null</c>。
    /// </summary>
    Task<JournalDto?> GetJournalAsync(
        long userId, string accountId, string symbol, DateOnly date, CancellationToken cancellationToken = default);

    /// <summary>
    /// 儲存日記（新增或更新）。
    /// </summary>
    Task SaveJournalAsync(SaveJournalInfo info, CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得指定使用者的全部日記。<paramref name="includeNotes"/> 為 <c>false</c> 時
    /// notes 為空字串（行為分析聚合用）；匯出時帶 <c>true</c> 取完整內容。
    /// </summary>
    Task<IReadOnlyList<JournalDto>> GetAllJournalsAsync(
        long userId, bool includeNotes = false, CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得指定使用者的日記範本；未設定時回傳 <c>null</c>。
    /// </summary>
    Task<string?> GetTemplateAsync(long userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 儲存指定使用者的日記範本。
    /// </summary>
    Task SaveTemplateAsync(long userId, string template, CancellationToken cancellationToken = default);
}
