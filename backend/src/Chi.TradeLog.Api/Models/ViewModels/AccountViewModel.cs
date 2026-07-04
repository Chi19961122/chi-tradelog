namespace Chi.TradeLog.Api.Models.ViewModels;

/// <summary>
/// 帳戶回應模型（ViewModel）。
/// </summary>
public class AccountViewModel
{
    /// <summary>
    /// 帳戶 id。
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// 帳戶名稱。
    /// </summary>
    public string Name { get; init; } = string.Empty;
}
