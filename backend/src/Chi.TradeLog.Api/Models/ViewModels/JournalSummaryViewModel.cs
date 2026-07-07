using Chi.TradeLog.Common.Models;

namespace Chi.TradeLog.Api.Models.ViewModels;

/// <summary>
/// 日記摘要回應模型（ViewModel）。供行為分析使用，不含 notes（HTML 可能很大）。
/// </summary>
public class JournalSummaryViewModel
{
    /// <summary>
    /// 所屬帳戶 id。
    /// </summary>
    public string AccountId { get; init; } = string.Empty;

    /// <summary>
    /// 商品代號。
    /// </summary>
    public string Symbol { get; init; } = string.Empty;

    /// <summary>
    /// 日記日期（ISO <c>yyyy-MM-dd</c>）。
    /// </summary>
    public DateOnly Date { get; init; }

    /// <summary>
    /// 情緒標籤。
    /// </summary>
    public IReadOnlyList<string> Emotions { get; init; } = [];

    /// <summary>
    /// 錯誤檢討清單。
    /// </summary>
    public IReadOnlyList<Mistake> Mistakes { get; init; } = [];
}
