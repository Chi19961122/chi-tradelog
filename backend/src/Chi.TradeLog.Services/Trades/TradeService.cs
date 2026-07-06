using AutoMapper;
using Chi.TradeLog.Common.Models.Conditions;
using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Common.Models.Dtos;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Repositories.Settings;
using Chi.TradeLog.Repositories.Trades;

namespace Chi.TradeLog.Services.Trades;

/// <summary>
/// 交易 Service 實作。將 InfoModel 轉為 Condition 查詢並回傳 Dto；
/// 寫入時計算損益、R 值與持倉時間等衍生欄位，並驗證帳戶歸屬（多租戶隔離）。
/// </summary>
public class TradeService : ITradeService
{
    private readonly ITradeRepository _repository;
    private readonly ISettingsRepository _settingsRepository;
    private readonly IMapper _mapper;

    /// <summary>
    /// 建立交易 Service。
    /// </summary>
    public TradeService(ITradeRepository repository, ISettingsRepository settingsRepository, IMapper mapper)
    {
        _repository = repository;
        _settingsRepository = settingsRepository;
        _mapper = mapper;
    }

    /// <summary>
    /// 依查詢資訊取得交易：將 InfoModel 轉為 Condition 查詢（以使用者為範圍），再把 DataModel 轉為 Dto 回傳。
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
    /// 新增一筆交易：驗證帳戶歸屬後計算衍生欄位並寫入；帳戶不屬於使用者時回傳 <c>null</c>。
    /// </summary>
    public async Task<TradeDto?> CreateTradeAsync(
        SaveTradeInfo info,
        CancellationToken cancellationToken = default)
    {
        var owned = await _settingsRepository.AccountExistsAsync(info.AccountId, info.UserId, cancellationToken);
        if (owned is false)
        {
            return null;
        }

        var dataModel = BuildDataModel(info);
        dataModel.UserId = info.UserId;
        dataModel.AccountId = info.AccountId;
        var newId = await _repository.InsertAsync(dataModel, cancellationToken);
        dataModel.Id = newId;
        return _mapper.Map<TradeDto>(dataModel);
    }

    /// <summary>
    /// 批次匯入多筆交易：驗證帳戶歸屬後逐筆計算衍生欄位，於單一 transaction 內新增；
    /// 帳戶不屬於使用者時回傳 <c>null</c>，否則回傳新增筆數。
    /// </summary>
    public async Task<int?> ImportTradesAsync(
        long userId,
        string accountId,
        IReadOnlyList<SaveTradeInfo> infos,
        CancellationToken cancellationToken = default)
    {
        var owned = await _settingsRepository.AccountExistsAsync(accountId, userId, cancellationToken);
        if (owned is false)
        {
            return null;
        }

        if (infos.Count == 0)
        {
            return 0;
        }

        var dataModels = infos
            .Select(info =>
            {
                var dataModel = BuildDataModel(info);
                dataModel.UserId = userId;
                dataModel.AccountId = accountId;
                return dataModel;
            })
            .ToList();

        return await _repository.InsertManyAsync(dataModels, cancellationToken);
    }

    /// <summary>
    /// 更新指定交易：重新計算衍生欄位並保留原帳戶（僅限本人資料）；找不到時回傳 <c>null</c>。
    /// </summary>
    public async Task<TradeDto?> UpdateTradeAsync(
        long id,
        SaveTradeInfo info,
        CancellationToken cancellationToken = default)
    {
        var existing = await _repository.GetByIdAsync(id, info.UserId, cancellationToken);
        if (existing is null)
        {
            return null;
        }

        var dataModel = BuildDataModel(info);
        dataModel.Id = id;
        dataModel.UserId = info.UserId;
        dataModel.AccountId = existing.AccountId; // 帳戶不因編輯而改變
        // 手動編輯不帶券商報表欄位，保留原值。
        dataModel.Charges = info.Charges ?? existing.Charges;
        dataModel.OpenedAt = info.OpenedAt ?? existing.OpenedAt;
        dataModel.ClosedAt = info.ClosedAt ?? existing.ClosedAt;
        await _repository.UpdateAsync(dataModel, cancellationToken);
        return _mapper.Map<TradeDto>(dataModel);
    }

    /// <summary>
    /// 刪除指定使用者的指定交易；有刪到列時回傳 <c>true</c>。
    /// </summary>
    public async Task<bool> DeleteTradeAsync(long id, long userId, CancellationToken cancellationToken = default)
    {
        var affected = await _repository.DeleteAsync(id, userId, cancellationToken);
        return affected > 0;
    }

    /// <summary>
    /// 由輸入資訊計算衍生欄位並組出 DataModel（不含 Id / UserId / AccountId）。
    /// 淨損益優先採用明確帶入的值（期貨等有合約乘數的商品由券商報表提供），
    /// 未帶入時以價差計算；持倉分鐘數優先由進／出場時間戳推導。
    /// </summary>
    private static TradeDataModel BuildDataModel(SaveTradeInfo info)
    {
        var side = info.Side == "Short" ? "Short" : "Long";
        var symbol = info.Sym.Trim().ToUpperInvariant();
        var pnl = info.Pnl ?? (side == "Long" ? info.Exit - info.Entry : info.Entry - info.Exit) * info.Qty;
        var rMultiple = Math.Round(pnl / 100m, 2);
        // day 對應「本月」第幾天（以執行當下的年月為基準，短月自動夾住）。
        var now = DateTime.UtcNow;
        var day = Math.Clamp(info.Day, 1, DateTime.DaysInMonth(now.Year, now.Month));
        var holdingMinutes = info.OpenedAt.HasValue && info.ClosedAt.HasValue
            ? Math.Max(0, (int)Math.Round((info.ClosedAt.Value - info.OpenedAt.Value).TotalMinutes))
            : 30 + (int)Math.Floor(
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
            TradedOn = new DateOnly(now.Year, now.Month, day),
            HoldingMinutes = holdingMinutes,
            Tags = tags.Length > 0 ? tags : ["manual"],
            Charges = info.Charges,
            OpenedAt = info.OpenedAt,
            ClosedAt = info.ClosedAt,
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
