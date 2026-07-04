namespace Chi.TradeLog.Api.Models.ViewModels;

/// <summary>
/// 應用程式設定的彙總回應模型（ViewModel）。
/// </summary>
public class SettingsViewModel
{
    /// <summary>
    /// 初始資金。
    /// </summary>
    public decimal InitialCapital { get; init; }

    /// <summary>
    /// 平台清單（含帳戶）。
    /// </summary>
    public IReadOnlyList<PlatformViewModel> Platforms { get; init; } = [];

    /// <summary>
    /// 可用商品代號清單。
    /// </summary>
    public IReadOnlyList<string> Symbols { get; init; } = [];

    /// <summary>
    /// 可用標籤清單。
    /// </summary>
    public IReadOnlyList<string> Tags { get; init; } = [];
}
