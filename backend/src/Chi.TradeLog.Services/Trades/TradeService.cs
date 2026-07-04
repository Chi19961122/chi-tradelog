using AutoMapper;
using Chi.TradeLog.Common.Models.Conditions;
using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Common.Models.Dtos;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Repositories.Trades;

namespace Chi.TradeLog.Services.Trades;

/// <summary>
/// 交易 Service 實作。將 InfoModel 轉為 Condition 查詢並回傳 Dto；
/// 寫入時計算損益、R 值與持倉時間等衍生欄位。
/// </summary>
public class TradeService : ITradeService
{
    // 本原型以 2026 年 7 月為基準月，day 對應 traded_on 的日。
    private const int BaseYear = 2026;
    private const int BaseMonth = 7;

    private readonly ITradeRepository _repository;
    private readonly IMapper _mapper;

    /// <summary>
    /// 建立交易 Service。
    /// </summary>
    public TradeService(ITradeRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    /// <summary>
    /// 依查詢資訊取得交易：將 InfoModel 轉為 Condition 查詢，再把 DataModel 轉為 Dto 回傳。
    /// </summary>
    public async Task<IReadOnlyList<TradeDto>> GetTradesAsync(
        TradeQueryInfo info,
        CancellationToken cancellationToken = default)
    {
        var condition = _mapper.Map<TradeQueryCondition>(info);
        var data = await _repository.GetByAccountsAsync(condition, cancellationToken);
        return _mapper.Map<IReadOnlyList<TradeDto>>(data);
    }

    /// <summary>
    /// 新增一筆交易：計算損益、R 值與持倉時間，寫入後回傳建立後的交易。
    /// </summary>
    public async Task<TradeDto> CreateTradeAsync(
        SaveTradeInfo info,
        CancellationToken cancellationToken = default)
    {
        var dataModel = BuildDataModel(info);
        dataModel.AccountId = info.AccountId;
        var newId = await _repository.InsertAsync(dataModel, cancellationToken);
        dataModel.Id = newId;
        return _mapper.Map<TradeDto>(dataModel);
    }

    /// <summary>
    /// 更新指定交易：重新計算衍生欄位並保留原帳戶；找不到時回傳 <c>null</c>。
    /// </summary>
    public async Task<TradeDto?> UpdateTradeAsync(
        long id,
        SaveTradeInfo info,
        CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        var dataModel = BuildDataModel(info);
        dataModel.Id = id;
        dataModel.AccountId = existing.AccountId; // 帳戶不因編輯而改變
        await _repository.UpdateAsync(dataModel, cancellationToken);
        return _mapper.Map<TradeDto>(dataModel);
    }

    /// <summary>
    /// 刪除指定交易；有刪到列時回傳 <c>true</c>。
    /// </summary>
    public async Task<bool> DeleteTradeAsync(long id, CancellationToken cancellationToken = default)
    {
        var affected = await _repository.DeleteAsync(id, cancellationToken);
        return affected > 0;
    }

    /// <summary>
    /// 由輸入資訊計算衍生欄位並組出 DataModel（不含 Id / AccountId）。
    /// </summary>
    private static TradeDataModel BuildDataModel(SaveTradeInfo info)
    {
        var side = info.Side == "Short" ? "Short" : "Long";
        var symbol = info.Sym.Trim().ToUpperInvariant();
        var pnl = (side == "Long" ? info.Exit - info.Entry : info.Entry - info.Exit) * info.Qty;
        var rMultiple = Math.Round(pnl / 100m, 2);
        var day = Math.Clamp(info.Day, 1, 31);
        var holdingMinutes = 30 + (int)Math.Floor(
            SeededRand((double)(info.Entry + info.Exit + info.Qty) * 7.7) * 400 + 0.5);
        var tags = info.Tags.Where(tag => string.IsNullOrWhiteSpace(tag) is false).ToArray();

        return new TradeDataModel
        {
            Symbol = symbol,
            Side = side,
            EntryPrice = info.Entry,
            ExitPrice = info.Exit,
            Quantity = info.Qty,
            Pnl = Math.Round(pnl, 2),
            RMultiple = rMultiple,
            TradedOn = new DateOnly(BaseYear, BaseMonth, day),
            HoldingMinutes = holdingMinutes,
            Tags = tags.Length > 0 ? tags : ["manual"],
        };
    }

    /// <summary>
    /// 與前端相同的確定性亂數（用於推導持倉時間）。
    /// </summary>
    private static double SeededRand(double seed)
    {
        var r = Math.Sin(seed * 12.9898) * 43758.5453;
        return r - Math.Floor(r);
    }
}
