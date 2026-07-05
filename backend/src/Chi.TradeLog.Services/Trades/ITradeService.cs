using Chi.TradeLog.Common.Models.Dtos;
using Chi.TradeLog.Common.Models.InfoModels;

namespace Chi.TradeLog.Services.Trades;

/// <summary>
/// 交易業務邏輯層（Service）。
/// </summary>
public interface ITradeService
{
    /// <summary>
    /// 依查詢資訊取得交易。
    /// </summary>
    Task<IReadOnlyList<TradeDto>> GetTradesAsync(
        TradeQueryInfo info,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 新增一筆交易（損益、R 值、持倉時間由後端計算），回傳建立後的交易。
    /// </summary>
    Task<TradeDto> CreateTradeAsync(
        SaveTradeInfo info,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 批次匯入多筆交易到指定帳戶，回傳實際新增筆數。
    /// </summary>
    Task<int> ImportTradesAsync(
        string accountId,
        IReadOnlyList<SaveTradeInfo> infos,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新指定交易；找不到時回傳 <c>null</c>。
    /// </summary>
    Task<TradeDto?> UpdateTradeAsync(
        long id,
        SaveTradeInfo info,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除指定交易；成功回傳 <c>true</c>。
    /// </summary>
    Task<bool> DeleteTradeAsync(long id, CancellationToken cancellationToken = default);
}
