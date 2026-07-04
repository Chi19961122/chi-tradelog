using Chi.TradeLog.Common.Models;

namespace Chi.TradeLog.Api.Models.ViewModels;

/// <summary>
/// 交易日記回應模型（ViewModel）。
/// </summary>
public class JournalViewModel
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
    /// 當月第幾天（1–31）。
    /// </summary>
    public int Day { get; init; }

    /// <summary>
    /// 筆記（HTML）。
    /// </summary>
    public string Notes { get; init; } = string.Empty;

    /// <summary>
    /// 情緒標籤。
    /// </summary>
    public IReadOnlyList<string> Emotions { get; init; } = [];

    /// <summary>
    /// 錯誤檢討清單。
    /// </summary>
    public IReadOnlyList<Mistake> Mistakes { get; init; } = [];
}
