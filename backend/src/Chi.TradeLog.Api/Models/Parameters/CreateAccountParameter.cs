namespace Chi.TradeLog.Api.Models.Parameters;

/// <summary>
/// 新增帳戶的請求參數（Parameter）。平台 id 來自路由。
/// </summary>
public class CreateAccountParameter
{
    /// <summary>
    /// 帳戶名稱。
    /// </summary>
    public string Name { get; init; } = string.Empty;
}
