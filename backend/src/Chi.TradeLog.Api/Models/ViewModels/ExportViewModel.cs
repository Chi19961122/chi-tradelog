namespace Chi.TradeLog.Api.Models.ViewModels;

/// <summary>
/// 全資料匯出回應模型（ViewModel）。包含本人全部資料，供備份／轉移使用。
/// </summary>
public class ExportViewModel
{
    /// <summary>
    /// 匯出時間（UTC）。
    /// </summary>
    public DateTimeOffset ExportedAt { get; init; }

    /// <summary>
    /// 設定（平台/帳戶、商品、標籤、初始資金）。
    /// </summary>
    public SettingsViewModel Settings { get; init; } = new();

    /// <summary>
    /// 全部交易。
    /// </summary>
    public IReadOnlyList<TradeViewModel> Trades { get; init; } = [];

    /// <summary>
    /// 全部日記（含完整 notes）。
    /// </summary>
    public IReadOnlyList<JournalViewModel> Journals { get; init; } = [];

    /// <summary>
    /// 日記範本（未設定時為 <c>null</c>）。
    /// </summary>
    public string? JournalTemplate { get; init; }

    /// <summary>
    /// 紀律規則 JSON（未設定時為 <c>null</c>）。
    /// </summary>
    public string? DisciplineRules { get; init; }
}
