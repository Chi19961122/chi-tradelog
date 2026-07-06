namespace Chi.TradeLog.Api.Models.Parameters;

/// <summary>
/// 平台／帳戶改名的請求參數（Parameter）。
/// </summary>
public class RenameParameter
{
    /// <summary>
    /// 新名稱。
    /// </summary>
    public string Name { get; init; } = string.Empty;
}
