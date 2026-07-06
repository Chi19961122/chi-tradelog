namespace Chi.TradeLog.Api.Models.Parameters;

/// <summary>
/// 管理員更新使用者基本資料的請求參數（Parameter）。
/// </summary>
public class UpdateUserParameter
{
    /// <summary>
    /// 顯示名稱。
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// 電子郵件（登入帳號）。
    /// </summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>
    /// 是否為管理員。
    /// </summary>
    public bool IsAdmin { get; init; }
}
