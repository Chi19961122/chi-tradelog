namespace Chi.TradeLog.Common.Models.DataModels;

/// <summary>
/// 帳戶資料模型（DataModel）— 對應 <c>accounts</c> 資料表。
/// </summary>
public class AccountDataModel
{
    /// <summary>
    /// 資料所屬使用者 ID。
    /// </summary>
    public long UserId { get; set; }

    /// <summary>
    /// 帳戶 id（如 <c>a1</c>）。
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// 所屬平台 id。
    /// </summary>
    public string PlatformId { get; set; } = string.Empty;

    /// <summary>
    /// 帳戶名稱。
    /// </summary>
    public string Name { get; set; } = string.Empty;
}
