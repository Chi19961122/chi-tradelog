namespace Chi.TradeLog.Api.Models.Parameters;

/// <summary>
/// 編輯交易的請求參數（Parameter）。損益、R 值、持倉時間由後端重新計算。
/// </summary>
public class UpdateTradeParameter
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
}
