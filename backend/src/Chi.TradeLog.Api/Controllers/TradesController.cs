using AutoMapper;
using Chi.TradeLog.Api.Models.Parameters;
using Chi.TradeLog.Api.Models.ViewModels;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Services.Trades;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace Chi.TradeLog.Api.Controllers;

/// <summary>
/// 交易查詢 API。
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class TradesController : ControllerBase
{
    private readonly ITradeService _tradeService;
    private readonly IMapper _mapper;
    private readonly IValidator<TradeQueryParameter> _validator;

    /// <summary>
    /// 建立交易 Controller。
    /// </summary>
    public TradesController(
        ITradeService tradeService,
        IMapper mapper,
        IValidator<TradeQueryParameter> validator)
    {
        _tradeService = tradeService;
        _mapper = mapper;
        _validator = validator;
    }

    /// <summary>
    /// 依帳戶查詢交易，依交易日期由新到舊排序。
    /// </summary>
    /// <param name="parameter">查詢參數（帳戶 ID 清單）。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <returns>符合條件的交易清單。</returns>
    /// <response code="200">查詢成功。</response>
    /// <response code="400">參數驗證失敗。</response>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<TradeViewModel>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IReadOnlyList<TradeViewModel>>> GetTradesAsync(
        [FromQuery] TradeQueryParameter parameter,
        CancellationToken cancellationToken)
    {
        var validationResult = await _validator.ValidateAsync(parameter, cancellationToken);
        if (validationResult.IsValid is false)
        {
            foreach (var error in validationResult.Errors)
            {
                ModelState.AddModelError(error.PropertyName, error.ErrorMessage);
            }
            return ValidationProblem(ModelState);
        }

        var info = _mapper.Map<TradeQueryInfo>(parameter);
        var dtos = await _tradeService.GetTradesAsync(info, cancellationToken);
        var viewModels = _mapper.Map<IReadOnlyList<TradeViewModel>>(dtos);

        return Ok(viewModels);
    }
}
