namespace Chi.TradeLog.Api.Models.ViewModels;

/// <summary>
/// 平台回應模型（ViewModel），內含其帳戶。
/// </summary>
public class PlatformViewModel
{
    /// <summary>
    /// 平台 id。
    /// </summary>
    public string Id { get; init; } = string.Empty;

    /// <summary>
    /// 平台名稱。
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// 該平台下的帳戶。
    /// </summary>
    public IReadOnlyList<AccountViewModel> Accounts { get; init; } = [];
}
