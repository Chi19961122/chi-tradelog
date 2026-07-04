namespace Chi.TradeLog.Common.Models.Dtos;

/// <summary>
/// 帳戶資料傳輸物件（Dto）。
/// </summary>
public class AccountDto
{
    /// <summary>
    /// 帳戶 id。
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// 帳戶名稱。
    /// </summary>
    public string Name { get; set; } = string.Empty;
}
