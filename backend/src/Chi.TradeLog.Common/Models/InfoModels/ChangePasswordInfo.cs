namespace Chi.TradeLog.Common.Models.InfoModels;

/// <summary>
/// 變更密碼的資訊模型（InfoModel）。
/// </summary>
public class ChangePasswordInfo
{
    /// <summary>
    /// 使用者電子郵件（取自登入權杖）。
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 目前密碼。
    /// </summary>
    public string CurrentPassword { get; set; } = string.Empty;

    /// <summary>
    /// 新密碼。
    /// </summary>
    public string NewPassword { get; set; } = string.Empty;
}
