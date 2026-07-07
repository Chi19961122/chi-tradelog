namespace Chi.TradeLog.Common.Models.DataModels;

/// <summary>
/// 交易日記資料模型（DataModel）— 對應 <c>journal_entries</c> 資料表。
/// <c>Mistakes</c> 以 JSON 字串對應 jsonb 欄位。
/// </summary>
public class JournalEntryDataModel
{
    /// <summary>
    /// 資料所屬使用者 ID。
    /// </summary>
    public long UserId { get; set; }

    /// <summary>
    /// 所屬帳戶 id。
    /// </summary>
    public string AccountId { get; set; } = string.Empty;

    /// <summary>
    /// 商品代號。
    /// </summary>
    public string Symbol { get; set; } = string.Empty;

    /// <summary>
    /// 日記日期（entry_date）。
    /// </summary>
    public DateOnly EntryDate { get; set; }

    /// <summary>
    /// 筆記（HTML）。
    /// </summary>
    public string Notes { get; set; } = string.Empty;

    /// <summary>
    /// 情緒標籤。
    /// </summary>
    public string[] Emotions { get; set; } = [];

    /// <summary>
    /// 錯誤檢討清單的 JSON 字串（jsonb）。
    /// </summary>
    public string Mistakes { get; set; } = "[]";
}
