using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AutoMapper;
using Chi.TradeLog.Api.Models.Parameters;
using Chi.TradeLog.Api.Models.ViewModels;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Services.Auth;
using Chi.TradeLog.Services.Users;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Chi.TradeLog.Api.Controllers;

/// <summary>
/// 認證 API（登入、換發權杖、變更密碼）。
/// </summary>
[Route("api/[controller]")]
public class AuthController : ApiControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserService _userService;
    private readonly IMapper _mapper;
    private readonly IValidator<LoginParameter> _loginValidator;
    private readonly IValidator<ChangePasswordParameter> _changePasswordValidator;

    /// <summary>
    /// 建立認證 Controller。
    /// </summary>
    public AuthController(
        IAuthService authService,
        IUserService userService,
        IMapper mapper,
        IValidator<LoginParameter> loginValidator,
        IValidator<ChangePasswordParameter> changePasswordValidator)
    {
        _authService = authService;
        _userService = userService;
        _mapper = mapper;
        _loginValidator = loginValidator;
        _changePasswordValidator = changePasswordValidator;
    }

    /// <summary>
    /// 以電子郵件與密碼登入，成功回傳 JWT 與使用者資訊。
    /// </summary>
    /// <param name="parameter">登入參數。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <returns>權杖與使用者。</returns>
    /// <response code="200">登入成功。</response>
    /// <response code="400">參數驗證失敗。</response>
    /// <response code="401">帳號或密碼錯誤。</response>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthViewModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthViewModel>> LoginAsync(
        [FromBody] LoginParameter parameter,
        CancellationToken cancellationToken)
    {
        var validation = await _loginValidator.ValidateAsync(parameter, cancellationToken);
        if (validation.IsValid is false)
        {
            return ValidationProblemFrom(validation);
        }

        var result = await _authService.LoginAsync(parameter.Email, parameter.Password, cancellationToken);
        if (result is null)
        {
            return Unauthorized();
        }

        return Ok(_mapper.Map<AuthViewModel>(result));
    }

    /// <summary>
    /// 以目前有效的權杖換發新的 JWT（延長工作階段，前端於到期前呼叫）。
    /// </summary>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <returns>新的權杖與使用者。</returns>
    /// <response code="200">換發成功。</response>
    /// <response code="401">權杖無效或已過期。</response>
    [HttpPost("refresh")]
    [Authorize]
    [ProducesResponseType(typeof(AuthViewModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthViewModel>> RefreshAsync(CancellationToken cancellationToken)
    {
        var email = User.FindFirstValue(JwtRegisteredClaimNames.Email);
        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized();
        }

        var result = await _authService.RefreshAsync(email, cancellationToken);
        if (result is null)
        {
            return Unauthorized();
        }

        return Ok(_mapper.Map<AuthViewModel>(result));
    }

    /// <summary>
    /// 由登入的使用者變更自己的密碼。
    /// </summary>
    /// <param name="parameter">目前密碼與新密碼。</param>
    /// <param name="cancellationToken">取消權杖。</param>
    /// <response code="204">變更成功。</response>
    /// <response code="400">參數驗證失敗，或目前密碼錯誤。</response>
    [HttpPut("password")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePasswordAsync(
        [FromBody] ChangePasswordParameter parameter,
        CancellationToken cancellationToken)
    {
        var validation = await _changePasswordValidator.ValidateAsync(parameter, cancellationToken);
        if (validation.IsValid is false)
        {
            return ValidationProblemFrom(validation);
        }

        var email = User.FindFirstValue(JwtRegisteredClaimNames.Email);
        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized();
        }

        var info = new ChangePasswordInfo
        {
            Email = email,
            CurrentPassword = parameter.CurrentPassword,
            NewPassword = parameter.NewPassword,
        };
        var changed = await _userService.ChangePasswordAsync(info, cancellationToken);
        if (changed is false)
        {
            return BadRequest(new ProblemDetails { Title = "目前密碼錯誤", Status = StatusCodes.Status400BadRequest });
        }

        return NoContent();
    }
}
