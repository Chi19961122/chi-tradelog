using Chi.TradeLog.Common.Models;

namespace Chi.TradeLog.Common.Models.InfoModels;

/// <summary>
/// 儲存交易日記的資訊模型（InfoModel）。
/// </summary>
public class SaveJournalInfo
{
    /// <summary>
    /// 所屬帳戶 id。
    /// </summary>
    public string AccountId { get; set; } = string.Empty;

    /// <summary>
    /// 商品代號。
    /// </summary>
    public string Symbol { get; set; } = string.Empty;

    /// <summary>
    /// 當月第幾天（1–31）。
    /// </summary>
    public int Day { get; set; }

    /// <summary>
    /// 筆記（HTML）。
    /// </summary>
    public string Notes { get; set; } = string.Empty;

    /// <summary>
    /// 情緒標籤。
    /// </summary>
    public IReadOnlyList<string> Emotions { get; set; } = [];

    /// <summary>
    /// 錯誤檢討清單。
    /// </summary>
    public IReadOnlyList<Mistake> Mistakes { get; set; } = [];
}
