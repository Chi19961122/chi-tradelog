using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Repositories.Data;
using Dapper;

namespace Chi.TradeLog.Repositories.Users;

/// <summary>
/// 以 Dapper 實作的使用者 Repository。
/// </summary>
public class UserRepository : IUserRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    private const string SelectByEmailSql = """
        SELECT id            AS Id,
               email         AS Email,
               password_hash AS PasswordHash,
               display_name  AS DisplayName
        FROM users
        WHERE email = @Email;
        """;

    /// <summary>
    /// 建立使用者 Repository。
    /// </summary>
    public UserRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    /// <summary>
    /// 依電子郵件取得使用者；找不到時回傳 <c>null</c>。
    /// </summary>
    public async Task<UserDataModel?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var command = new CommandDefinition(SelectByEmailSql, new { Email = email }, cancellationToken: cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<UserDataModel>(command);
    }
}
