namespace Chi.TradeLog.Api.Models.ViewModels;

/// <summary>
/// 登入回應模型（ViewModel）。
/// </summary>
public class AuthViewModel
{
    /// <summary>
    /// JWT 存取權杖。
    /// </summary>
    public string Token { get; init; } = string.Empty;

    /// <summary>
    /// 登入的使用者。
    /// </summary>
    public UserViewModel User { get; init; } = new();
}
