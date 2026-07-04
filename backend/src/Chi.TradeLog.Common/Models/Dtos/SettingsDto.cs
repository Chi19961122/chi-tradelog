namespace Chi.TradeLog.Common.Models.Dtos;

/// <summary>
/// 應用程式設定的彙總資料傳輸物件（Dto）。
/// </summary>
public class SettingsDto
{
    /// <summary>
    /// 初始資金。
    /// </summary>
    public decimal InitialCapital { get; set; }

    /// <summary>
    /// 平台清單（含帳戶）。
    /// </summary>
    public IReadOnlyList<PlatformDto> Platforms { get; set; } = [];

    /// <summary>
    /// 可用商品代號清單。
    /// </summary>
    public IReadOnlyList<string> Symbols { get; set; } = [];

    /// <summary>
    /// 可用標籤清單。
    /// </summary>
    public IReadOnlyList<string> Tags { get; set; } = [];
}
