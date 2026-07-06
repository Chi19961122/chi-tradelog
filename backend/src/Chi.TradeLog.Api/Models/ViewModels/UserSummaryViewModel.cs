namespace Chi.TradeLog.Api.Models.ViewModels;

/// <summary>
/// 使用者摘要回應模型（ViewModel）。
/// </summary>
public class UserSummaryViewModel
{
    /// <summary>
    /// 使用者 id。
    /// </summary>
    public long Id { get; init; }

    /// <summary>
    /// 顯示名稱。
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// 電子郵件。
    /// </summary>
    public string Email { get; init; } = string.Empty;

    /// <summary>
    /// 是否為管理員。
    /// </summary>
    public bool IsAdmin { get; init; }
}
