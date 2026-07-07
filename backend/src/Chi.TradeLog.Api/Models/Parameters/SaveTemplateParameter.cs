namespace Chi.TradeLog.Api.Models.Parameters;

/// <summary>
/// 儲存日記範本的請求參數（Parameter）。
/// </summary>
public class SaveTemplateParameter
{
    /// <summary>
    /// 範本內容（HTML；空字串代表清除範本）。
    /// </summary>
    public string Template { get; init; } = string.Empty;
}
