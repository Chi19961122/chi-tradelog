using AutoMapper;
using Chi.TradeLog.Api.Models.Parameters;
using Chi.TradeLog.Api.Models.ViewModels;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Services.Users;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Chi.TradeLog.Api.Controllers;

/// <summary>
/// 使用者管理 API（僅限管理員）。
/// </summary>
[Route("api/[controller]")]
[Authorize(Policy = "Admin")]
public class UsersController : ApiControllerBase
{
    private readonly IUserService _userService;
    private readonly IMapper _mapper;
    private readonly IValidator<CreateUserParameter> _createValidator;

    /// <summary>
    /// 建立使用者管理 Controller。
    /// </summary>
    public UsersController(
        IUserService userService,
        IMapper mapper,
        IValidator<CreateUserParameter> createValidator)
    {
        _userService = userService;
        _mapper = mapper;
        _createValidator = createValidator;
    }

    /// <summary>
    /// 取得所有使用者。
    /// </summary>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <returns>使用者摘要清單。</returns>
    /// <response code="200">查詢成功。</response>
    /// <response code="403">非管理員。</response>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<UserSummaryViewModel>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<UserSummaryViewModel>>> ListAsync(CancellationToken cancellationToken)
    {
        var users = await _userService.ListAsync(cancellationToken);
        return Ok(_mapper.Map<IReadOnlyList<UserSummaryViewModel>>(users));
    }

    /// <summary>
    /// 建立使用者（未指定密碼則使用系統預設）。
    /// </summary>
    /// <param name="parameter">建立參數。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <returns>建立的使用者與其初始密碼。</returns>
    /// <response code="201">建立成功。</response>
    /// <response code="400">參數驗證失敗。</response>
    /// <response code="409">電子郵件已被使用。</response>
    [HttpPost]
    [ProducesResponseType(typeof(CreateUserResultViewModel), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CreateUserResultViewModel>> CreateAsync(
        [FromBody] CreateUserParameter parameter,
        CancellationToken cancellationToken)
    {
        var validation = await _createValidator.ValidateAsync(parameter, cancellationToken);
        if (validation.IsValid is false)
        {
            return ValidationProblemFrom(validation);
        }

        var info = _mapper.Map<CreateUserInfo>(parameter);
        var result = await _userService.CreateAsync(info, cancellationToken);
        if (result is null)
        {
            return Conflict(new ProblemDetails { Title = "電子郵件已被使用", Status = StatusCodes.Status409Conflict });
        }

        var vm = _mapper.Map<CreateUserResultViewModel>(result);
        return Created($"/api/users/{vm.User.Id}", vm);
    }

    /// <summary>
    /// 將指定使用者的密碼重設為系統預設。
    /// </summary>
    /// <param name="id">使用者 id。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <returns>重設後的預設密碼。</returns>
    /// <response code="200">重設成功。</response>
    /// <response code="404">找不到使用者。</response>
    [HttpPost("{id:long}/reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetPasswordAsync(long id, CancellationToken cancellationToken)
    {
        var password = await _userService.ResetPasswordAsync(id, cancellationToken);
        return password is null ? NotFound() : Ok(new { temporaryPassword = password });
    }
}
