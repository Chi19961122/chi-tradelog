namespace Chi.TradeLog.Api.Models.Parameters;

/// <summary>
/// 新增標籤的請求參數（Parameter）。
/// </summary>
public class AddTagParameter
{
    /// <summary>
    /// 標籤名稱。
    /// </summary>
    public string Tag { get; init; } = string.Empty;
}
