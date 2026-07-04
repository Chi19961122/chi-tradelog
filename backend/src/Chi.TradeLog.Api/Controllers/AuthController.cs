using AutoMapper;
using Chi.TradeLog.Api.Models.Parameters;
using Chi.TradeLog.Api.Models.ViewModels;
using Chi.TradeLog.Services.Auth;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Chi.TradeLog.Api.Controllers;

/// <summary>
/// 認證 API（登入）。
/// </summary>
[Route("api/[controller]")]
[AllowAnonymous]
public class AuthController : ApiControllerBase
{
    private readonly IAuthService _authService;
    private readonly IMapper _mapper;
    private readonly IValidator<LoginParameter> _loginValidator;

    /// <summary>
    /// 建立認證 Controller。
    /// </summary>
    public AuthController(
        IAuthService authService,
        IMapper mapper,
        IValidator<LoginParameter> loginValidator)
    {
        _authService = authService;
        _mapper = mapper;
        _loginValidator = loginValidator;
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
}
