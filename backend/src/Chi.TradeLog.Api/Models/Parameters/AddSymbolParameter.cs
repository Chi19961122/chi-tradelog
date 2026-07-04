namespace Chi.TradeLog.Api.Models.Parameters;

/// <summary>
/// 新增商品代號的請求參數（Parameter）。
/// </summary>
public class AddSymbolParameter
{
    /// <summary>
    /// 商品代號。
    /// </summary>
    public string Symbol { get; init; } = string.Empty;
}
