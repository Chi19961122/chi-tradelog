namespace Chi.TradeLog.Api.Models.Parameters;

/// <summary>
/// 登入請求參數（Parameter）。
/// </summary>
public class LoginParameter
{
    /// <summary>
    /// 電子郵件。
    /// </summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>
    /// 密碼。
    /// </summary>
    public string Password { get; init; } = string.Empty;
}
