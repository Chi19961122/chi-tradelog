namespace Chi.TradeLog.Api.Models.Parameters;

/// <summary>
/// 交易查詢請求參數（Parameter）。
/// </summary>
public class TradeQueryParameter
{
    /// <summary>
    /// 要查詢的帳戶 ID 清單，例如 <c>?accountIds=a1&amp;accountIds=a3</c>（至少一個）。
    /// </summary>
    public string[] AccountIds { get; init; } = [];
}
