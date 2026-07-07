using AutoMapper;
using Chi.TradeLog.Api.Models.Parameters;
using Chi.TradeLog.Api.Models.ViewModels;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Services.Journal;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Chi.TradeLog.Api.Controllers;

/// <summary>
/// 交易日記查詢與儲存 API。
/// </summary>
[Route("api/[controller]")]
[Authorize]
public class JournalController : ApiControllerBase
{
    private readonly IJournalService _journalService;
    private readonly IMapper _mapper;
    private readonly IValidator<SaveJournalParameter> _saveValidator;

    /// <summary>
    /// 建立交易日記 Controller。
    /// </summary>
    public JournalController(
        IJournalService journalService,
        IMapper mapper,
        IValidator<SaveJournalParameter> saveValidator)
    {
        _journalService = journalService;
        _mapper = mapper;
        _saveValidator = saveValidator;
    }

    /// <summary>
    /// 依帳戶/商品/日期取得日記。
    /// </summary>
    /// <param name="parameter">查詢參數。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <returns>日記內容。</returns>
    /// <response code="200">查詢成功。</response>
    /// <response code="404">尚無此日記（前端可套用預設）。</response>
    [HttpGet]
    [ProducesResponseType(typeof(JournalViewModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<JournalViewModel>> GetJournalAsync(
        [FromQuery] JournalQueryParameter parameter,
        CancellationToken cancellationToken)
    {
        var dto = await _journalService.GetJournalAsync(
            CurrentUserId, parameter.AccountId, parameter.Symbol, parameter.Date, cancellationToken);
        if (dto is null)
        {
            return NotFound();
        }
        return Ok(_mapper.Map<JournalViewModel>(dto));
    }

    /// <summary>
    /// 取得自己的全部日記摘要（不含 notes），供行為分析聚合。
    /// </summary>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <returns>日記摘要清單。</returns>
    /// <response code="200">查詢成功。</response>
    [HttpGet("all")]
    [ProducesResponseType(typeof(IReadOnlyList<JournalSummaryViewModel>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<JournalSummaryViewModel>>> GetAllJournalsAsync(
        CancellationToken cancellationToken)
    {
        var dtos = await _journalService.GetAllJournalsAsync(CurrentUserId, cancellationToken);
        return Ok(_mapper.Map<IReadOnlyList<JournalSummaryViewModel>>(dtos));
    }

    /// <summary>
    /// 儲存日記（新增或更新）。
    /// </summary>
    /// <param name="parameter">日記內容。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <response code="204">儲存成功。</response>
    /// <response code="400">參數驗證失敗。</response>
    [HttpPut]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SaveJournalAsync(
        [FromBody] SaveJournalParameter parameter,
        CancellationToken cancellationToken)
    {
        var validation = await _saveValidator.ValidateAsync(parameter, cancellationToken);
        if (validation.IsValid is false)
        {
            return ValidationProblemFrom(validation);
        }

        var info = _mapper.Map<SaveJournalInfo>(parameter);
        info.UserId = CurrentUserId;
        await _journalService.SaveJournalAsync(info, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// 取得自己的日記範本；未設定時回傳空範本。
    /// </summary>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <returns>範本內容。</returns>
    /// <response code="200">查詢成功（未設定時 template 為 null）。</response>
    [HttpGet("template")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTemplateAsync(CancellationToken cancellationToken)
    {
        var template = await _journalService.GetTemplateAsync(CurrentUserId, cancellationToken);
        return Ok(new { template });
    }

    /// <summary>
    /// 儲存自己的日記範本（跨裝置持久化）。
    /// </summary>
    /// <param name="parameter">範本內容。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <response code="204">儲存成功。</response>
    [HttpPut("template")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> SaveTemplateAsync(
        [FromBody] SaveTemplateParameter parameter,
        CancellationToken cancellationToken)
    {
        await _journalService.SaveTemplateAsync(CurrentUserId, parameter.Template, cancellationToken);
        return NoContent();
    }
}
