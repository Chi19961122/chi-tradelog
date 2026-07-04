namespace Chi.TradeLog.Common.Models.InfoModels;

/// <summary>
/// 新增帳戶的資訊模型（InfoModel）。
/// </summary>
public class CreateAccountInfo
{
    /// <summary>
    /// 所屬平台 id。
    /// </summary>
    public string PlatformId { get; set; } = string.Empty;

    /// <summary>
    /// 帳戶名稱。
    /// </summary>
    public string Name { get; set; } = string.Empty;
}
