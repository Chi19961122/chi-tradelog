namespace Chi.TradeLog.Api.Models.Parameters;

/// <summary>
/// 儲存紀律規則請求參數（Parameter）。規則以 JSON 字串儲存，內容由前端定義。
/// </summary>
public class SaveDisciplineRulesParameter
{
    /// <summary>
    /// 規則 JSON（例：<c>{"maxTradesPerDay":5,"revengeMinutes":30}</c>）。
    /// </summary>
    public string Rules { get; init; } = string.Empty;
}
