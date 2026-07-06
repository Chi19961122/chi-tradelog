using Chi.TradeLog.Common.Models.Dtos;
using Chi.TradeLog.Common.Models.InfoModels;

namespace Chi.TradeLog.Services.Trades;

/// <summary>
/// 交易業務邏輯層（Service）。所有操作皆以使用者為範圍（多租戶隔離）。
/// </summary>
public interface ITradeService
{
    /// <summary>
    /// 依查詢資訊取得交易（以使用者為範圍）。
    /// </summary>
    Task<IReadOnlyList<TradeDto>> GetTradesAsync(
        TradeQueryInfo info,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 新增一筆交易（損益、R 值、持倉時間由後端計算）；帳戶不屬於使用者時回傳 <c>null</c>。
    /// </summary>
    Task<TradeDto?> CreateTradeAsync(
        SaveTradeInfo info,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 批次匯入多筆交易到指定帳戶；帳戶不屬於使用者時回傳 <c>null</c>，否則回傳新增筆數。
    /// </summary>
    Task<int?> ImportTradesAsync(
        long userId,
        string accountId,
        IReadOnlyList<SaveTradeInfo> infos,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新指定交易（僅限本人資料）；找不到時回傳 <c>null</c>。
    /// </summary>
    Task<TradeDto?> UpdateTradeAsync(
        long id,
        SaveTradeInfo info,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除指定使用者的指定交易；成功回傳 <c>true</c>。
    /// </summary>
    Task<bool> DeleteTradeAsync(long id, long userId, CancellationToken cancellationToken = default);
}
