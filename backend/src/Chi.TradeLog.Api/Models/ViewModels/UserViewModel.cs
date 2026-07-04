namespace Chi.TradeLog.Api.Models.ViewModels;

/// <summary>
/// 使用者回應模型（ViewModel）。
/// </summary>
public class UserViewModel
{
    /// <summary>
    /// 顯示名稱。
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// 電子郵件。
    /// </summary>
    public string Email { get; init; } = string.Empty;
}
