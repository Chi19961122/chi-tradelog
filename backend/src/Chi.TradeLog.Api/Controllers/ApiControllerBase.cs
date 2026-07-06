using System.Security.Claims;
using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;

namespace Chi.TradeLog.Api.Controllers;

/// <summary>
/// API 控制器基底，提供共用的驗證錯誤處理與目前使用者識別。
/// </summary>
[ApiController]
[Produces("application/json")]
public abstract class ApiControllerBase : ControllerBase
{
    /// <summary>
    /// 目前登入使用者的 ID（取自 JWT 的 <c>sub</c> claim；解析失敗回傳 0，不會對應任何資料）。
    /// </summary>
    protected long CurrentUserId
    {
        get
        {
            // Program 設定 MapInboundClaims = false，claim 名稱保留原始的 "sub"。
            var sub = User.FindFirstValue("sub");
            return long.TryParse(sub, out var id) ? id : 0;
        }
    }

    /// <summary>
    /// 將 FluentValidation 的驗證結果轉為 400 ValidationProblem 回應。
    /// </summary>
    protected ActionResult ValidationProblemFrom(ValidationResult validationResult)
    {
        foreach (var error in validationResult.Errors)
        {
            ModelState.AddModelError(error.PropertyName, error.ErrorMessage);
        }
        return ValidationProblem(ModelState);
    }
}
