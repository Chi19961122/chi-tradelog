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

    private const string Columns = """
        id            AS Id,
        email         AS Email,
        password_hash AS PasswordHash,
        display_name  AS DisplayName,
        is_admin      AS IsAdmin
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
        var command = new CommandDefinition(
            $"SELECT {Columns} FROM users WHERE email = @Email;", new { Email = email }, cancellationToken: cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<UserDataModel>(command);
    }

    /// <summary>
    /// 依主鍵取得使用者；找不到時回傳 <c>null</c>。
    /// </summary>
    public async Task<UserDataModel?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var command = new CommandDefinition(
            $"SELECT {Columns} FROM users WHERE id = @Id;", new { Id = id }, cancellationToken: cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<UserDataModel>(command);
    }

    /// <summary>
    /// 取得所有使用者，依名稱排序。
    /// </summary>
    public async Task<IReadOnlyList<UserDataModel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var command = new CommandDefinition(
            $"SELECT {Columns} FROM users ORDER BY display_name;", cancellationToken: cancellationToken);
        var rows = await connection.QueryAsync<UserDataModel>(command);
        return rows.AsList();
    }

    /// <summary>
    /// 判斷電子郵件是否已被使用。
    /// </summary>
    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var command = new CommandDefinition(
            "SELECT EXISTS(SELECT 1 FROM users WHERE email = @Email);", new { Email = email }, cancellationToken: cancellationToken);
        return await connection.ExecuteScalarAsync<bool>(command);
    }

    /// <summary>
    /// 新增使用者，回傳新產生的主鍵。
    /// </summary>
    public async Task<long> InsertAsync(UserDataModel user, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var command = new CommandDefinition("""
            INSERT INTO users (email, password_hash, display_name, is_admin)
            VALUES (@Email, @PasswordHash, @DisplayName, @IsAdmin)
            RETURNING id;
            """, user, cancellationToken: cancellationToken);
        return await connection.ExecuteScalarAsync<long>(command);
    }

    /// <summary>
    /// 更新指定使用者的密碼雜湊，回傳受影響列數。
    /// </summary>
    public async Task<int> UpdatePasswordAsync(long id, string passwordHash, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var command = new CommandDefinition(
            "UPDATE users SET password_hash = @passwordHash WHERE id = @id;",
            new { id, passwordHash }, cancellationToken: cancellationToken);
        return await connection.ExecuteAsync(command);
    }
}
