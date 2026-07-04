namespace Chi.TradeLog.Api.Models.Parameters;

/// <summary>
/// 查詢交易日記的請求參數（Parameter）。
/// </summary>
public class JournalQueryParameter
{
    /// <summary>
    /// 帳戶 id。
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
}
