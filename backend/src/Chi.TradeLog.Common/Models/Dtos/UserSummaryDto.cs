namespace Chi.TradeLog.Common.Models.Dtos;

/// <summary>
/// 使用者摘要資料傳輸物件（Dto）— 供管理員列表使用。
/// </summary>
public class UserSummaryDto
{
    /// <summary>
    /// 使用者主鍵。
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// 顯示名稱。
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 電子郵件。
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 是否為管理員。
    /// </summary>
    public bool IsAdmin { get; set; }
}
