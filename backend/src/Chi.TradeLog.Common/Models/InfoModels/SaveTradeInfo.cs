namespace Chi.TradeLog.Common.Models.InfoModels;

/// <summary>
/// 新增／編輯交易的資訊模型（InfoModel）— Controller 轉自 Parameter，傳給 Service。
/// 編輯時 <see cref="AccountId"/> 可留空（沿用原帳戶）。
/// </summary>
public class SaveTradeInfo
{
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
    /// 當月第幾天（1–31）。
    /// </summary>
    public int Day { get; set; }

    /// <summary>
    /// 標籤清單。
    /// </summary>
    public IReadOnlyList<string> Tags { get; set; } = [];
}
