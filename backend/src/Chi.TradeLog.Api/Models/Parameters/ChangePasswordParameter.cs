namespace Chi.TradeLog.Api.Models.Parameters;

/// <summary>
/// 變更自身密碼的請求參數（Parameter）。
/// </summary>
public class ChangePasswordParameter
{
    /// <summary>
    /// 目前密碼。
    /// </summary>
    public string CurrentPassword { get; init; } = string.Empty;

    /// <summary>
    /// 新密碼。
    /// </summary>
    public string NewPassword { get; init; } = string.Empty;
}
