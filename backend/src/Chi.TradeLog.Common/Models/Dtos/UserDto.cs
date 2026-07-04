namespace Chi.TradeLog.Common.Models.Dtos;

/// <summary>
/// 使用者資料傳輸物件（Dto）。
/// </summary>
public class UserDto
{
    /// <summary>
    /// 顯示名稱。
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 電子郵件。
    /// </summary>
    public string Email { get; set; } = string.Empty;
}
