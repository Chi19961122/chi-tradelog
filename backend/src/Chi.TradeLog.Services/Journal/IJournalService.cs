using Chi.TradeLog.Common.Models.Dtos;
using Chi.TradeLog.Common.Models.InfoModels;

namespace Chi.TradeLog.Services.Journal;

/// <summary>
/// 交易日記業務邏輯層（Service）。
/// </summary>
public interface IJournalService
{
    /// <summary>
    /// 依帳戶/商品/日期取得日記；找不到時回傳 <c>null</c>。
    /// </summary>
    Task<JournalDto?> GetJournalAsync(
        string accountId, string symbol, int day, CancellationToken cancellationToken = default);

    /// <summary>
    /// 儲存日記（新增或更新）。
    /// </summary>
    Task SaveJournalAsync(SaveJournalInfo info, CancellationToken cancellationToken = default);
}
