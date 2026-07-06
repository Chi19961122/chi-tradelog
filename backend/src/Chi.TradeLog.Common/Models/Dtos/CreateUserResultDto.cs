namespace Chi.TradeLog.Common.Models.Dtos;

/// <summary>
/// 建立使用者的結果（Dto）— 含使用者摘要與其初始（預設）密碼。
/// </summary>
public class CreateUserResultDto
{
    /// <summary>
    /// 建立的使用者。
    /// </summary>
    public UserSummaryDto User { get; set; } = new();

    /// <summary>
    /// 初始密碼（管理員需轉交使用者，使用者可自行變更）。
    /// </summary>
    public string TemporaryPassword { get; set; } = string.Empty;
}
