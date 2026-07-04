using AutoMapper;
using Chi.TradeLog.Api.Models.Parameters;
using Chi.TradeLog.Api.Models.ViewModels;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Services.Settings;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Chi.TradeLog.Api.Controllers;

/// <summary>
/// 應用程式設定（平台/帳戶、商品、標籤、初始資金）查詢與維護 API。
/// </summary>
[Route("api/[controller]")]
[Authorize]
public class SettingsController : ApiControllerBase
{
    private readonly ISettingsService _settingsService;
    private readonly IMapper _mapper;
    private readonly IValidator<UpdateCapitalParameter> _capitalValidator;
    private readonly IValidator<CreatePlatformParameter> _platformValidator;
    private readonly IValidator<CreateAccountParameter> _accountValidator;
    private readonly IValidator<AddSymbolParameter> _symbolValidator;
    private readonly IValidator<AddTagParameter> _tagValidator;

    /// <summary>
    /// 建立設定 Controller。
    /// </summary>
    public SettingsController(
        ISettingsService settingsService,
        IMapper mapper,
        IValidator<UpdateCapitalParameter> capitalValidator,
        IValidator<CreatePlatformParameter> platformValidator,
        IValidator<CreateAccountParameter> accountValidator,
        IValidator<AddSymbolParameter> symbolValidator,
        IValidator<AddTagParameter> tagValidator)
    {
        _settingsService = settingsService;
        _mapper = mapper;
        _capitalValidator = capitalValidator;
        _platformValidator = platformValidator;
        _accountValidator = accountValidator;
        _symbolValidator = symbolValidator;
        _tagValidator = tagValidator;
    }

    /// <summary>
    /// 取得彙總設定。
    /// </summary>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <returns>設定資料。</returns>
    /// <response code="200">查詢成功。</response>
    [HttpGet]
    [ProducesResponseType(typeof(SettingsViewModel), StatusCodes.Status200OK)]
    public async Task<ActionResult<SettingsViewModel>> GetSettingsAsync(CancellationToken cancellationToken)
    {
        var dto = await _settingsService.GetSettingsAsync(cancellationToken);
        return Ok(_mapper.Map<SettingsViewModel>(dto));
    }

    /// <summary>
    /// 更新初始資金。
    /// </summary>
    /// <param name="parameter">初始資金參數。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <response code="204">更新成功。</response>
    /// <response code="400">參數驗證失敗。</response>
    [HttpPut("capital")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateCapitalAsync(
        [FromBody] UpdateCapitalParameter parameter,
        CancellationToken cancellationToken)
    {
        var validation = await _capitalValidator.ValidateAsync(parameter, cancellationToken);
        if (validation.IsValid is false)
        {
            return ValidationProblemFrom(validation);
        }

        await _settingsService.UpdateInitialCapitalAsync(parameter.InitialCapital, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// 新增平台。
    /// </summary>
    /// <param name="parameter">平台參數。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <returns>建立後的平台。</returns>
    /// <response code="201">建立成功。</response>
    /// <response code="400">參數驗證失敗。</response>
    [HttpPost("platforms")]
    [ProducesResponseType(typeof(PlatformViewModel), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PlatformViewModel>> CreatePlatformAsync(
        [FromBody] CreatePlatformParameter parameter,
        CancellationToken cancellationToken)
    {
        var validation = await _platformValidator.ValidateAsync(parameter, cancellationToken);
        if (validation.IsValid is false)
        {
            return ValidationProblemFrom(validation);
        }

        var info = _mapper.Map<CreatePlatformInfo>(parameter);
        var dto = await _settingsService.CreatePlatformAsync(info, cancellationToken);
        return Created($"/api/settings/platforms/{dto.Id}", _mapper.Map<PlatformViewModel>(dto));
    }

    /// <summary>
    /// 刪除平台（連同其帳戶）。
    /// </summary>
    /// <param name="id">平台 id。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <response code="204">刪除成功。</response>
    /// <response code="404">找不到平台。</response>
    [HttpDelete("platforms/{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePlatformAsync(string id, CancellationToken cancellationToken)
    {
        var deleted = await _settingsService.DeletePlatformAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>
    /// 在指定平台下新增帳戶。
    /// </summary>
    /// <param name="platformId">平台 id。</param>
    /// <param name="parameter">帳戶參數。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <returns>建立後的帳戶。</returns>
    /// <response code="201">建立成功。</response>
    /// <response code="400">參數驗證失敗。</response>
    /// <response code="404">找不到平台。</response>
    [HttpPost("platforms/{platformId}/accounts")]
    [ProducesResponseType(typeof(AccountViewModel), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AccountViewModel>> CreateAccountAsync(
        string platformId,
        [FromBody] CreateAccountParameter parameter,
        CancellationToken cancellationToken)
    {
        var validation = await _accountValidator.ValidateAsync(parameter, cancellationToken);
        if (validation.IsValid is false)
        {
            return ValidationProblemFrom(validation);
        }

        var info = new CreateAccountInfo { PlatformId = platformId, Name = parameter.Name };
        var dto = await _settingsService.CreateAccountAsync(info, cancellationToken);
        if (dto is null)
        {
            return NotFound();
        }
        return Created($"/api/settings/accounts/{dto.Id}", _mapper.Map<AccountViewModel>(dto));
    }

    /// <summary>
    /// 刪除帳戶。
    /// </summary>
    /// <param name="id">帳戶 id。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <response code="204">刪除成功。</response>
    /// <response code="404">找不到帳戶。</response>
    [HttpDelete("accounts/{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAccountAsync(string id, CancellationToken cancellationToken)
    {
        var deleted = await _settingsService.DeleteAccountAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>
    /// 新增商品代號。
    /// </summary>
    /// <param name="parameter">商品參數。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <response code="204">新增成功（或已存在）。</response>
    /// <response code="400">參數驗證失敗。</response>
    [HttpPost("symbols")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddSymbolAsync(
        [FromBody] AddSymbolParameter parameter,
        CancellationToken cancellationToken)
    {
        var validation = await _symbolValidator.ValidateAsync(parameter, cancellationToken);
        if (validation.IsValid is false)
        {
            return ValidationProblemFrom(validation);
        }

        await _settingsService.AddSymbolAsync(parameter.Symbol, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// 刪除商品代號。
    /// </summary>
    /// <param name="ticker">商品代號。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <response code="204">刪除成功。</response>
    /// <response code="404">找不到商品代號。</response>
    [HttpDelete("symbols/{ticker}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveSymbolAsync(string ticker, CancellationToken cancellationToken)
    {
        var removed = await _settingsService.RemoveSymbolAsync(ticker, cancellationToken);
        return removed ? NoContent() : NotFound();
    }

    /// <summary>
    /// 新增標籤。
    /// </summary>
    /// <param name="parameter">標籤參數。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <response code="204">新增成功（或已存在）。</response>
    /// <response code="400">參數驗證失敗。</response>
    [HttpPost("tags")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddTagAsync(
        [FromBody] AddTagParameter parameter,
        CancellationToken cancellationToken)
    {
        var validation = await _tagValidator.ValidateAsync(parameter, cancellationToken);
        if (validation.IsValid is false)
        {
            return ValidationProblemFrom(validation);
        }

        await _settingsService.AddTagAsync(parameter.Tag, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// 刪除標籤。
    /// </summary>
    /// <param name="name">標籤名稱。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <response code="204">刪除成功。</response>
    /// <response code="404">找不到標籤。</response>
    [HttpDelete("tags/{name}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveTagAsync(string name, CancellationToken cancellationToken)
    {
        var removed = await _settingsService.RemoveTagAsync(name, cancellationToken);
        return removed ? NoContent() : NotFound();
    }
}
