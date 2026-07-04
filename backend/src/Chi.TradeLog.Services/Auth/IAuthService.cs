using Chi.TradeLog.Common.Models.Dtos;

namespace Chi.TradeLog.Services.Auth;

/// <summary>
/// 認證業務邏輯層（Service）。
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// 驗證帳號密碼並發行 JWT；憑證錯誤時回傳 <c>null</c>。
    /// </summary>
    Task<AuthResultDto?> LoginAsync(string email, string password, CancellationToken cancellationToken = default);

    /// <summary>
    /// 為既有登入的使用者重新發行 JWT（延長工作階段）；使用者不存在時回傳 <c>null</c>。
    /// </summary>
    Task<AuthResultDto?> RefreshAsync(string email, CancellationToken cancellationToken = default);
}
