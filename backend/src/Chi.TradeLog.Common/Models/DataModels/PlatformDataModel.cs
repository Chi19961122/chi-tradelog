namespace Chi.TradeLog.Common.Models.DataModels;

/// <summary>
/// 平台資料模型（DataModel）— 對應 <c>platforms</c> 資料表。
/// </summary>
public class PlatformDataModel
{
    /// <summary>
    /// 平台 id（如 <c>p1</c>）。
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// 平台名稱。
    /// </summary>
    public string Name { get; set; } = string.Empty;
}
