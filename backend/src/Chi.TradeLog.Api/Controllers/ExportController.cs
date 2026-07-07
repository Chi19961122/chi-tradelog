using AutoMapper;
using Chi.TradeLog.Api.Models.ViewModels;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Services.Journal;
using Chi.TradeLog.Services.Settings;
using Chi.TradeLog.Services.Trades;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Chi.TradeLog.Api.Controllers;

/// <summary>
/// 全資料匯出 API。回傳本人全部資料（多租戶隔離：一律以 JWT 使用者為範圍）。
/// </summary>
[Route("api/[controller]")]
[Authorize]
public class ExportController : ApiControllerBase
{
    private readonly ISettingsService _settingsService;
    private readonly ITradeService _tradeService;
    private readonly IJournalService _journalService;
    private readonly IMapper _mapper;

    /// <summary>
    /// 建立匯出 Controller。
    /// </summary>
    public ExportController(
        ISettingsService settingsService,
        ITradeService tradeService,
        IJournalService journalService,
        IMapper mapper)
    {
        _settingsService = settingsService;
        _tradeService = tradeService;
        _journalService = journalService;
        _mapper = mapper;
    }

    /// <summary>
    /// 匯出自己的全部資料（設定、交易、日記含 notes、日記範本、紀律規則）。
    /// </summary>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <returns>完整匯出內容。</returns>
    /// <response code="200">匯出成功。</response>
    [HttpGet]
    [ProducesResponseType(typeof(ExportViewModel), StatusCodes.Status200OK)]
    public async Task<ActionResult<ExportViewModel>> ExportAsync(CancellationToken cancellationToken)
    {
        var settings = await _settingsService.GetSettingsAsync(CurrentUserId, cancellationToken);
        var accountIds = settings.Platforms
            .SelectMany(platform => platform.Accounts)
            .Select(account => account.Id)
            .ToList();
        var trades = await _tradeService.GetTradesAsync(
            new TradeQueryInfo { UserId = CurrentUserId, AccountIds = accountIds }, cancellationToken);
        var journals = await _journalService.GetAllJournalsAsync(
            CurrentUserId, includeNotes: true, cancellationToken);
        var journalTemplate = await _journalService.GetTemplateAsync(CurrentUserId, cancellationToken);
        var disciplineRules = await _settingsService.GetDisciplineRulesAsync(CurrentUserId, cancellationToken);

        return Ok(new ExportViewModel
        {
            ExportedAt = DateTimeOffset.UtcNow,
            Settings = _mapper.Map<SettingsViewModel>(settings),
            Trades = _mapper.Map<IReadOnlyList<TradeViewModel>>(trades),
            Journals = _mapper.Map<IReadOnlyList<JournalViewModel>>(journals),
            JournalTemplate = journalTemplate,
            DisciplineRules = disciplineRules,
        });
    }
}
