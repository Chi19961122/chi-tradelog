using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Chi.TradeLog.Tests.TestAuth;

/// <summary>
/// 測試用認證處理器：一律以固定身分認證通過，讓受保護端點在整合測試中可存取。
/// </summary>
public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    /// <summary>
    /// 測試用認證方案名稱。
    /// </summary>
    public const string SchemeName = "Test";

    /// <summary>
    /// 建立測試認證處理器。
    /// </summary>
    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    /// <summary>
    /// 一律回傳成功的認證票證。
    /// </summary>
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[] { new Claim(ClaimTypes.Name, "Test User") };
        var identity = new ClaimsIdentity(claims, SchemeName);
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
