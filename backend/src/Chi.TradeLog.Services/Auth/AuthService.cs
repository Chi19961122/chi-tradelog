using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Chi.TradeLog.Common.Models.Dtos;
using Chi.TradeLog.Common.Options;
using Chi.TradeLog.Repositories.Users;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Chi.TradeLog.Services.Auth;

/// <summary>
/// 認證 Service 實作。以 BCrypt 驗證密碼，成功後發行 JWT。
/// </summary>
public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly JwtOptions _jwtOptions;

    /// <summary>
    /// 建立認證 Service。
    /// </summary>
    public AuthService(IUserRepository userRepository, IOptions<JwtOptions> jwtOptions)
    {
        _userRepository = userRepository;
        _jwtOptions = jwtOptions.Value;
    }

    /// <summary>
    /// 驗證帳號密碼並發行 JWT；憑證錯誤時回傳 <c>null</c>。
    /// </summary>
    public async Task<AuthResultDto?> LoginAsync(string email, string password, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(email.Trim().ToLowerInvariant(), cancellationToken);
        if (user is null || BCrypt.Net.BCrypt.Verify(password, user.PasswordHash) is false)
        {
            return null;
        }

        return BuildResult(user);
    }

    /// <summary>
    /// 為既有登入的使用者重新發行 JWT（延長工作階段）；使用者不存在時回傳 <c>null</c>。
    /// </summary>
    public async Task<AuthResultDto?> RefreshAsync(string email, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(email.Trim().ToLowerInvariant(), cancellationToken);
        return user is null ? null : BuildResult(user);
    }

    /// <summary>
    /// 由使用者資料組出登入結果（含新簽發的 JWT）。
    /// </summary>
    private AuthResultDto BuildResult(Common.Models.DataModels.UserDataModel user) => new()
    {
        Token = CreateToken(user.Id, user.Email, user.DisplayName),
        User = new UserDto { Name = user.DisplayName, Email = user.Email },
    };

    /// <summary>
    /// 依使用者資訊建立簽章後的 JWT。
    /// </summary>
    private string CreateToken(long userId, string email, string displayName)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim("name", displayName),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtOptions.ExpiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
