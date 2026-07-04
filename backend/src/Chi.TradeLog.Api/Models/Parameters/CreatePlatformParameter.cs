namespace Chi.TradeLog.Api.Models.Parameters;

/// <summary>
/// 新增平台的請求參數（Parameter）。
/// </summary>
public class CreatePlatformParameter
{
    /// <summary>
    /// 平台名稱。
    /// </summary>
    public string Name { get; init; } = string.Empty;
}
