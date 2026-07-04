namespace Chi.TradeLog.Common.Models.Dtos;

/// <summary>
/// 登入結果資料傳輸物件（Dto）。
/// </summary>
public class AuthResultDto
{
    /// <summary>
    /// JWT 存取權杖。
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// 登入的使用者。
    /// </summary>
    public UserDto User { get; set; } = new();
}
