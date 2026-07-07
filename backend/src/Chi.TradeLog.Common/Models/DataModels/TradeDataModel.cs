namespace Chi.TradeLog.Common.Models.DataModels;

/// <summary>
/// 交易資料模型（DataModel）— 對應 <c>trades</c> 資料表結構，僅供 Repository 使用。
/// </summary>
public class TradeDataModel
{
    /// <summary>
    /// 交易主鍵。
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// 資料所屬使用者 ID。
    /// </summary>
    public long UserId { get; set; }

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
    /// R 倍數（風險報酬比）。
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
    public string[] Tags { get; set; } = [];

    /// <summary>
    /// 停損價（選填；有值時 R 以真實風險計算）。
    /// </summary>
    public decimal? StopLoss { get; set; }

    /// <summary>
    /// 手續費（來自券商報表；手動輸入的交易為 <c>null</c>）。
    /// </summary>
    public decimal? Charges { get; set; }

    /// <summary>
    /// 進場時間（來自券商報表；手動輸入的交易為 <c>null</c>）。
    /// </summary>
    public DateTimeOffset? OpenedAt { get; set; }

    /// <summary>
    /// 出場時間（來自券商報表；手動輸入的交易為 <c>null</c>）。
    /// </summary>
    public DateTimeOffset? ClosedAt { get; set; }
}
