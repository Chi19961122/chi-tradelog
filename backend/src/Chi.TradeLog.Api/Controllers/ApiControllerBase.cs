using FluentValidation.Results;
using Microsoft.AspNetCore.Mvc;

namespace Chi.TradeLog.Api.Controllers;

/// <summary>
/// API 控制器基底，提供共用的驗證錯誤處理。
/// </summary>
[ApiController]
[Produces("application/json")]
public abstract class ApiControllerBase : ControllerBase
{
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
