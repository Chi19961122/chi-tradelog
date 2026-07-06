namespace Chi.TradeLog.Common.Models.Dtos;

/// <summary>
/// 交易資料傳輸物件（Dto）— Service 對外回傳，供 Controller 轉成 ViewModel。
/// </summary>
public class TradeDto
{
    /// <summary>
    /// 交易主鍵。
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// 所屬帳戶 ID。
    /// </summary>
    public string AccountId { get; set; } = string.Empty;

    /// <summary>
    /// 商品代號（ticker）。
    /// </summary>
    public string Symbol { get; set; } = string.Empty;

    /// <summary>
    /// 方向：<c>Long</c> 或 <c>Short</c>。
    /// </summary>
    public string Side { get; set; } = string.Empty;

    /// <summary>
    /// 進場價。
    /// </summary>
    public decimal EntryPrice { get; set; }

    /// <summary>
    /// 出場價。
    /// </summary>
    public decimal ExitPrice { get; set; }

    /// <summary>
    /// 數量。
    /// </summary>
    public int Quantity { get; set; }

    /// <summary>
    /// 損益（美元）。
    /// </summary>
    public decimal Pnl { get; set; }

    /// <summary>
    /// R 倍數。
    /// </summary>
    public decimal RMultiple { get; set; }

    /// <summary>
    /// 交易日期。
    /// </summary>
    public DateOnly TradedOn { get; set; }

    /// <summary>
    /// 持倉分鐘數。
    /// </summary>
    public int HoldingMinutes { get; set; }

    /// <summary>
    /// 標籤清單。
    /// </summary>
    public IReadOnlyList<string> Tags { get; set; } = [];

    /// <summary>
    /// 手續費（無資料時為 <c>null</c>）。
    /// </summary>
    public decimal? Charges { get; set; }

    /// <summary>
    /// 進場時間（無資料時為 <c>null</c>）。
    /// </summary>
    public DateTimeOffset? OpenedAt { get; set; }

    /// <summary>
    /// 出場時間（無資料時為 <c>null</c>）。
    /// </summary>
    public DateTimeOffset? ClosedAt { get; set; }
}
