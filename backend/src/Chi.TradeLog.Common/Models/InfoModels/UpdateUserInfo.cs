namespace Chi.TradeLog.Common.Models.InfoModels;

/// <summary>
/// 更新使用者基本資料的資訊模型（InfoModel）— Controller 轉自 Parameter，傳給 Service。
/// </summary>
public class UpdateUserInfo
{
    /// <summary>
    /// 顯示名稱。
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 電子郵件（登入帳號）。
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 是否為管理員。
    /// </summary>
    public bool IsAdmin { get; set; }
}
