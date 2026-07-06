namespace Chi.TradeLog.Api.Models.Parameters;

/// <summary>
/// 管理員建立使用者的請求參數（Parameter）。
/// </summary>
public class CreateUserParameter
{
    /// <summary>
    /// 電子郵件（登入帳號）。
    /// </summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>
    /// 顯示名稱。
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// 初始密碼；留空則使用系統預設密碼。
    /// </summary>
    public string? Password { get; init; }
}
