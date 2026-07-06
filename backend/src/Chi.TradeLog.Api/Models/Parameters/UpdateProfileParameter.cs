namespace Chi.TradeLog.Api.Models.Parameters;

/// <summary>
/// 使用者更新自己個人檔案（顯示名稱／電子郵件）的請求參數（Parameter）。
/// </summary>
public class UpdateProfileParameter
{
    /// <summary>
    /// 顯示名稱。
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// 電子郵件（登入帳號；變更後會回發新權杖）。
    /// </summary>
    public string Email { get; init; } = string.Empty;
}
