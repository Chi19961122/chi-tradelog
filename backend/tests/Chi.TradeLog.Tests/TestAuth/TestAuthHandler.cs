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
    /// 測試身分的使用者 ID（對應 JWT 的 sub claim）。
    /// </summary>
    public const long TestUserId = 1;

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
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, "Test User"),
            // 與正式 JWT 一致：sub 為使用者 ID（Program 設 MapInboundClaims=false，claim 名稱保留 "sub"）。
            new Claim("sub", TestUserId.ToString()),
        };
        var identity = new ClaimsIdentity(claims, SchemeName);
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
