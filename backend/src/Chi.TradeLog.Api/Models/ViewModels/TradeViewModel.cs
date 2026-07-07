namespace Chi.TradeLog.Api.Models.ViewModels;

/// <summary>
/// 交易回應模型（ViewModel）。欄位對齊前端 <c>Trade</c> 型別（camelCase 序列化）。
/// </summary>
public class TradeViewModel
{
    /// <summary>
    /// 交易 ID（字串）。
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// 所屬帳戶 ID。
    /// </summary>
    public string AccountId { get; init; } = string.Empty;

    /// <summary>
    /// 商品代號。
    /// </summary>
    public string Sym { get; init; } = string.Empty;

    /// <summary>
    /// 方向：<c>Long</c> 或 <c>Short</c>。
    /// </summary>
    public string Side { get; init; } = string.Empty;

    /// <summary>
    /// R 倍數。
    /// </summary>
    public decimal R { get; init; }

    /// <summary>
    /// 損益（美元）。
    /// </summary>
    public decimal Pnl { get; init; }

    /// <summary>
    /// 進場價。
    /// </summary>
    public decimal Entry { get; init; }

    /// <summary>
    /// 出場價。
    /// </summary>
    public decimal Exit { get; init; }

    /// <summary>
    /// 數量。
    /// </summary>
    public int Qty { get; init; }

    /// <summary>
    /// 交易日期（ISO <c>yyyy-MM-dd</c>）。
    /// </summary>
    public DateOnly Date { get; init; }

    /// <summary>
    /// 標籤清單。
    /// </summary>
    public IReadOnlyList<string> Tags { get; init; } = [];

    /// <summary>
    /// 持倉分鐘數。
    /// </summary>
    public int HoldingMinutes { get; init; }

    /// <summary>
    /// 手續費（無資料時為 <c>null</c>）。
    /// </summary>
    public decimal? Charges { get; init; }

    /// <summary>
    /// 進場時間（無資料時為 <c>null</c>）。
    /// </summary>
    public DateTimeOffset? OpenedAt { get; init; }

    /// <summary>
    /// 出場時間（無資料時為 <c>null</c>）。
    /// </summary>
    public DateTimeOffset? ClosedAt { get; init; }
}
