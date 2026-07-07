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
    /// 日記日期。
    /// </summary>
    public DateOnly Date { get; init; }
}
