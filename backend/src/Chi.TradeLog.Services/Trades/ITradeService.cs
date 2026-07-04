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
}
