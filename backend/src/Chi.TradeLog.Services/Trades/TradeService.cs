using AutoMapper;
using Chi.TradeLog.Common.Models.Conditions;
using Chi.TradeLog.Common.Models.Dtos;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Repositories.Trades;

namespace Chi.TradeLog.Services.Trades;

/// <summary>
/// 交易 Service 實作。將 InfoModel 轉為 Condition 查詢，回傳 Dto。
/// </summary>
public class TradeService : ITradeService
{
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

    /// <inheritdoc />
    public async Task<IReadOnlyList<TradeDto>> GetTradesAsync(
        TradeQueryInfo info,
        CancellationToken cancellationToken = default)
    {
        var condition = _mapper.Map<TradeQueryCondition>(info);
        var data = await _repository.GetByAccountsAsync(condition, cancellationToken);
        return _mapper.Map<IReadOnlyList<TradeDto>>(data);
    }
}
