namespace Chi.TradeLog.Common.Models.InfoModels;

/// <summary>
/// 建立使用者的資訊模型（InfoModel）。
/// </summary>
public class CreateUserInfo
{
    /// <summary>
    /// 電子郵件（登入帳號）。
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 顯示名稱。
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 初始密碼；留空則使用系統預設密碼。
    /// </summary>
    public string? Password { get; set; }
}
