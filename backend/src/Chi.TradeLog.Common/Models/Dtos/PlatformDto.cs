namespace Chi.TradeLog.Common.Models.Dtos;

/// <summary>
/// 平台資料傳輸物件（Dto），內含其帳戶。
/// </summary>
public class PlatformDto
{
    /// <summary>
    /// 平台 id。
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// 平台名稱。
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 該平台下的帳戶。
    /// </summary>
    public IReadOnlyList<AccountDto> Accounts { get; set; } = [];
}
