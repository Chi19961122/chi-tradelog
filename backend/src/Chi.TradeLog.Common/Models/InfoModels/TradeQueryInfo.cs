namespace Chi.TradeLog.Common.Models.InfoModels;

/// <summary>
/// 交易查詢資訊模型（InfoModel）— Controller 轉自 Parameter，傳給 Service。
/// </summary>
public class TradeQueryInfo
{
    /// <summary>
    /// 要查詢的帳戶 ID 清單。
    /// </summary>
    public IReadOnlyList<string> AccountIds { get; set; } = [];
}
