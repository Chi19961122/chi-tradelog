namespace Chi.TradeLog.Common.Models.DataModels;

/// <summary>
/// 使用者資料模型（DataModel）— 對應 <c>users</c> 資料表。
/// </summary>
public class UserDataModel
{
    /// <summary>
    /// 使用者主鍵。
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// 電子郵件（登入帳號）。
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// BCrypt 密碼雜湊。
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// 顯示名稱。
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;
}
