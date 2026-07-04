namespace Chi.TradeLog.Api.Models.Parameters;

/// <summary>
/// 更新初始資金的請求參數（Parameter）。
/// </summary>
public class UpdateCapitalParameter
{
    /// <summary>
    /// 初始資金。
    /// </summary>
    public decimal InitialCapital { get; init; }
}
