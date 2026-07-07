namespace Chi.TradeLog.Api.Models.Parameters;

/// <summary>
/// 批次匯入交易的請求參數（Parameter）。
/// </summary>
public class ImportTradesParameter
{
    /// <summary>
    /// 寫入的帳戶 ID。
    /// </summary>
    public string AccountId { get; init; } = string.Empty;

    /// <summary>
    /// 要匯入的交易列。
    /// </summary>
    public List<ImportTradeRow> Trades { get; init; } = [];
}

/// <summary>
/// 匯入交易的單一列。損益可由券商報表明確帶入（期貨等有合約乘數的商品），
/// 未帶入時由後端以價差計算；R 值與持倉時間由後端推導。
/// </summary>
public class ImportTradeRow
{
    /// <summary>
    /// 商品代號。
    /// </summary>
    public string Sym { get; init; } = string.Empty;

    /// <summary>
    /// 方向：<c>Long</c> 或 <c>Short</c>。
    /// </summary>
    public string Side { get; init; } = "Long";

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
    /// 交易日期。
    /// </summary>
    public DateOnly Date { get; init; }

    /// <summary>
    /// 標籤清單。
    /// </summary>
    public string[] Tags { get; init; } = [];

    /// <summary>
    /// 停損價（選填；有值時 R 以真實風險計算）。
    /// </summary>
    public decimal? StopLoss { get; init; }

    /// <summary>
    /// 明確指定的淨損益（選填；<c>null</c> 時由後端以價差計算）。
    /// </summary>
    public decimal? Pnl { get; init; }

    /// <summary>
    /// 手續費（選填）。
    /// </summary>
    public decimal? Charges { get; init; }

    /// <summary>
    /// 進場時間（選填）。
    /// </summary>
    public DateTimeOffset? OpenedAt { get; init; }

    /// <summary>
    /// 出場時間（選填）。
    /// </summary>
    public DateTimeOffset? ClosedAt { get; init; }
}
