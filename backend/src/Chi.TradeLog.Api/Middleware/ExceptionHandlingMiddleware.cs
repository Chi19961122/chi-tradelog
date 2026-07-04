using Microsoft.AspNetCore.Mvc;

namespace Chi.TradeLog.Api.Middleware;

/// <summary>
/// 統一例外處理 middleware — 攔截未處理的例外，回傳標準化的 ProblemDetails。
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    /// <summary>
    /// 建立例外處理 middleware。
    /// </summary>
    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    /// <summary>
    /// 執行 middleware。
    /// </summary>
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "處理請求時發生未預期的例外：{Path}", context.Request.Path);

            var problem = new ProblemDetails
            {
                Title = "伺服器發生未預期的錯誤",
                Status = StatusCodes.Status500InternalServerError,
            };

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsJsonAsync(problem);
        }
    }
}
