namespace Chi.TradeLog.Common.Models.InfoModels;

/// <summary>
/// 新增／編輯交易的資訊模型（InfoModel）— Controller 轉自 Parameter，傳給 Service。
/// 編輯時 <see cref="AccountId"/> 可留空（沿用原帳戶）。
/// </summary>
public class SaveTradeInfo
{
    /// <summary>
    /// 發出請求的使用者 ID（由 Controller 依 JWT 填入）。
    /// </summary>
    public long UserId { get; set; }

    /// <summary>
    /// 寫入的帳戶 ID（新增時必填）。
    /// </summary>
    public string AccountId { get; set; } = string.Empty;

    /// <summary>
    /// 商品代號。
    /// </summary>
    public string Sym { get; set; } = string.Empty;

    /// <summary>
    /// 方向：<c>Long</c> 或 <c>Short</c>。
    /// </summary>
    public string Side { get; set; } = "Long";

    /// <summary>
    /// 進場價。
    /// </summary>
    public decimal Entry { get; set; }

    /// <summary>
    /// 出場價。
    /// </summary>
    public decimal Exit { get; set; }

    /// <summary>
    /// 數量。
    /// </summary>
    public int Qty { get; set; }

    /// <summary>
    /// 交易日期。
    /// </summary>
    public DateOnly TradedOn { get; set; }

    /// <summary>
    /// 標籤清單。
    /// </summary>
    public IReadOnlyList<string> Tags { get; set; } = [];

    /// <summary>
    /// 明確指定的淨損益（券商報表匯入用；<c>null</c> 時由後端以價差計算）。
    /// </summary>
    public decimal? Pnl { get; set; }

    /// <summary>
    /// 手續費（選填）。
    /// </summary>
    public decimal? Charges { get; set; }

    /// <summary>
    /// 進場時間（選填；與 <see cref="ClosedAt"/> 同時提供時用於推導持倉分鐘數）。
    /// </summary>
    public DateTimeOffset? OpenedAt { get; set; }

    /// <summary>
    /// 出場時間（選填）。
    /// </summary>
    public DateTimeOffset? ClosedAt { get; set; }
}
