using AutoMapper;
using Chi.TradeLog.Api.Models.Parameters;
using Chi.TradeLog.Api.Models.ViewModels;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Services.Trades;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Chi.TradeLog.Api.Controllers;

/// <summary>
/// 交易查詢與維護 API。
/// </summary>
[Route("api/[controller]")]
[Authorize]
public class TradesController : ApiControllerBase
{
    private readonly ITradeService _tradeService;
    private readonly IMapper _mapper;
    private readonly IValidator<TradeQueryParameter> _queryValidator;
    private readonly IValidator<CreateTradeParameter> _createValidator;
    private readonly IValidator<UpdateTradeParameter> _updateValidator;
    private readonly IValidator<ImportTradesParameter> _importValidator;

    /// <summary>
    /// 建立交易 Controller。
    /// </summary>
    public TradesController(
        ITradeService tradeService,
        IMapper mapper,
        IValidator<TradeQueryParameter> queryValidator,
        IValidator<CreateTradeParameter> createValidator,
        IValidator<UpdateTradeParameter> updateValidator,
        IValidator<ImportTradesParameter> importValidator)
    {
        _tradeService = tradeService;
        _mapper = mapper;
        _queryValidator = queryValidator;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
        _importValidator = importValidator;
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
        var validationResult = await _queryValidator.ValidateAsync(parameter, cancellationToken);
        if (validationResult.IsValid is false)
        {
            return ValidationProblemFrom(validationResult);
        }

        var info = _mapper.Map<TradeQueryInfo>(parameter);
        var dtos = await _tradeService.GetTradesAsync(info, cancellationToken);
        var viewModels = _mapper.Map<IReadOnlyList<TradeViewModel>>(dtos);

        return Ok(viewModels);
    }

    /// <summary>
    /// 新增一筆交易。損益、R 值、持倉時間由後端計算。
    /// </summary>
    /// <param name="parameter">新增交易參數。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <returns>建立後的交易。</returns>
    /// <response code="201">建立成功。</response>
    /// <response code="400">參數驗證失敗。</response>
    [HttpPost]
    [ProducesResponseType(typeof(TradeViewModel), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TradeViewModel>> CreateTradeAsync(
        [FromBody] CreateTradeParameter parameter,
        CancellationToken cancellationToken)
    {
        var validationResult = await _createValidator.ValidateAsync(parameter, cancellationToken);
        if (validationResult.IsValid is false)
        {
            return ValidationProblemFrom(validationResult);
        }

        var info = _mapper.Map<SaveTradeInfo>(parameter);
        var dto = await _tradeService.CreateTradeAsync(info, cancellationToken);
        var viewModel = _mapper.Map<TradeViewModel>(dto);

        return Created($"/api/trades/{viewModel.Id}", viewModel);
    }

    /// <summary>
    /// 批次匯入多筆交易到指定帳戶。
    /// </summary>
    /// <param name="parameter">匯入參數（帳戶 ID 與交易列）。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <returns>匯入結果（新增筆數）。</returns>
    /// <response code="200">匯入成功。</response>
    /// <response code="400">參數驗證失敗。</response>
    [HttpPost("import")]
    [ProducesResponseType(typeof(ImportResultViewModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ImportResultViewModel>> ImportTradesAsync(
        [FromBody] ImportTradesParameter parameter,
        CancellationToken cancellationToken)
    {
        var validationResult = await _importValidator.ValidateAsync(parameter, cancellationToken);
        if (validationResult.IsValid is false)
        {
            return ValidationProblemFrom(validationResult);
        }

        var infos = parameter.Trades.Select(row => _mapper.Map<SaveTradeInfo>(row)).ToList();
        var imported = await _tradeService.ImportTradesAsync(parameter.AccountId, infos, cancellationToken);

        return Ok(new ImportResultViewModel { Imported = imported });
    }

    /// <summary>
    /// 更新指定交易。
    /// </summary>
    /// <param name="id">交易 ID。</param>
    /// <param name="parameter">編輯交易參數。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <returns>更新後的交易。</returns>
    /// <response code="200">更新成功。</response>
    /// <response code="400">參數驗證失敗。</response>
    /// <response code="404">找不到交易。</response>
    [HttpPut("{id:long}")]
    [ProducesResponseType(typeof(TradeViewModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TradeViewModel>> UpdateTradeAsync(
        long id,
        [FromBody] UpdateTradeParameter parameter,
        CancellationToken cancellationToken)
    {
        var validationResult = await _updateValidator.ValidateAsync(parameter, cancellationToken);
        if (validationResult.IsValid is false)
        {
            return ValidationProblemFrom(validationResult);
        }

        var info = _mapper.Map<SaveTradeInfo>(parameter);
        var dto = await _tradeService.UpdateTradeAsync(id, info, cancellationToken);
        if (dto is null)
        {
            return NotFound();
        }

        var viewModel = _mapper.Map<TradeViewModel>(dto);
        return Ok(viewModel);
    }

    /// <summary>
    /// 刪除指定交易。
    /// </summary>
    /// <param name="id">交易 ID。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <response code="204">刪除成功。</response>
    /// <response code="404">找不到交易。</response>
    [HttpDelete("{id:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTradeAsync(long id, CancellationToken cancellationToken)
    {
        var deleted = await _tradeService.DeleteTradeAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
