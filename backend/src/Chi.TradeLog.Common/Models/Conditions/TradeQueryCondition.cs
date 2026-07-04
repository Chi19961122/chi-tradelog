namespace Chi.TradeLog.Common.Models.Conditions;

/// <summary>
/// 交易查詢條件（Condition）— Service 轉自 InfoModel，傳給 Repository 作為查詢條件。
/// </summary>
public class TradeQueryCondition
{
    /// <summary>
    /// 要查詢的帳戶 ID 清單。
    /// </summary>
    public IReadOnlyList<string> AccountIds { get; set; } = [];
}
