using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Repositories.Data;
using Dapper;

namespace Chi.TradeLog.Repositories.Settings;

/// <summary>
/// 以 Dapper 實作的設定 Repository。所有查詢與寫入皆以 user_id 為範圍（多租戶隔離）。
/// </summary>
public class SettingsRepository : ISettingsRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    /// <summary>
    /// 建立設定 Repository。
    /// </summary>
    public SettingsRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    /// <summary>
    /// 取得指定使用者的所有平台，依名稱排序。
    /// </summary>
    public async Task<IReadOnlyList<PlatformDataModel>> GetPlatformsAsync(long userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var rows = await connection.QueryAsync<PlatformDataModel>(new CommandDefinition(
            "SELECT user_id AS UserId, id AS Id, name AS Name FROM platforms WHERE user_id = @userId ORDER BY name;",
            new { userId }, cancellationToken: cancellationToken));
        return rows.AsList();
    }

    /// <summary>
    /// 取得指定使用者的所有帳戶。
    /// </summary>
    public async Task<IReadOnlyList<AccountDataModel>> GetAccountsAsync(long userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var rows = await connection.QueryAsync<AccountDataModel>(new CommandDefinition(
            "SELECT user_id AS UserId, id AS Id, platform_id AS PlatformId, name AS Name FROM accounts WHERE user_id = @userId ORDER BY name;",
            new { userId }, cancellationToken: cancellationToken));
        return rows.AsList();
    }

    /// <summary>
    /// 取得指定使用者的所有商品代號。
    /// </summary>
    public async Task<IReadOnlyList<string>> GetSymbolsAsync(long userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var rows = await connection.QueryAsync<string>(new CommandDefinition(
            "SELECT ticker FROM symbols WHERE user_id = @userId ORDER BY ticker;",
            new { userId }, cancellationToken: cancellationToken));
        return rows.AsList();
    }

    /// <summary>
    /// 取得指定使用者的所有標籤。
    /// </summary>
    public async Task<IReadOnlyList<string>> GetTagsAsync(long userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var rows = await connection.QueryAsync<string>(new CommandDefinition(
            "SELECT name FROM tags WHERE user_id = @userId ORDER BY name;",
            new { userId }, cancellationToken: cancellationToken));
        return rows.AsList();
    }

    /// <summary>
    /// 取得指定使用者的初始資金；尚無資料時回傳 <c>null</c>。
    /// </summary>
    public async Task<decimal?> GetInitialCapitalAsync(long userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteScalarAsync<decimal?>(new CommandDefinition(
            "SELECT initial_capital FROM app_settings WHERE user_id = @userId;",
            new { userId }, cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 更新指定使用者的初始資金（不存在時新增該列），回傳受影響列數。
    /// </summary>
    public async Task<int> UpdateInitialCapitalAsync(long userId, decimal value, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteAsync(new CommandDefinition(
            """
            INSERT INTO app_settings (user_id, initial_capital) VALUES (@userId, @value)
            ON CONFLICT (user_id) DO UPDATE SET initial_capital = EXCLUDED.initial_capital;
            """,
            new { userId, value }, cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 取得指定使用者的日記範本；未設定時回傳 <c>null</c>。
    /// </summary>
    public async Task<string?> GetJournalTemplateAsync(long userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteScalarAsync<string?>(new CommandDefinition(
            "SELECT journal_template FROM app_settings WHERE user_id = @userId;",
            new { userId }, cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 更新指定使用者的日記範本（該列不存在時以預設初始資金一併建立），回傳受影響列數。
    /// </summary>
    public async Task<int> UpdateJournalTemplateAsync(long userId, string template, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteAsync(new CommandDefinition(
            """
            INSERT INTO app_settings (user_id, initial_capital, journal_template) VALUES (@userId, 10000, @template)
            ON CONFLICT (user_id) DO UPDATE SET journal_template = EXCLUDED.journal_template;
            """,
            new { userId, template }, cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 取得指定使用者的紀律規則 JSON；未設定時回傳 <c>null</c>。
    /// </summary>
    public async Task<string?> GetDisciplineRulesAsync(long userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteScalarAsync<string?>(new CommandDefinition(
            "SELECT discipline_rules::text FROM app_settings WHERE user_id = @userId;",
            new { userId }, cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 更新指定使用者的紀律規則 JSON（該列不存在時以預設初始資金一併建立），回傳受影響列數。
    /// </summary>
    public async Task<int> UpdateDisciplineRulesAsync(long userId, string rulesJson, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteAsync(new CommandDefinition(
            """
            INSERT INTO app_settings (user_id, initial_capital, discipline_rules) VALUES (@userId, 10000, @rulesJson::jsonb)
            ON CONFLICT (user_id) DO UPDATE SET discipline_rules = EXCLUDED.discipline_rules;
            """,
            new { userId, rulesJson }, cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 判斷指定使用者是否擁有該平台。
    /// </summary>
    public async Task<bool> PlatformExistsAsync(string id, long userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(
            "SELECT EXISTS(SELECT 1 FROM platforms WHERE id = @id AND user_id = @userId);",
            new { id, userId }, cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 判斷指定使用者是否擁有該帳戶。
    /// </summary>
    public async Task<bool> AccountExistsAsync(string id, long userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(
            "SELECT EXISTS(SELECT 1 FROM accounts WHERE id = @id AND user_id = @userId);",
            new { id, userId }, cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 新增平台（含 user_id）。
    /// </summary>
    public async Task InsertPlatformAsync(PlatformDataModel platform, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(
            "INSERT INTO platforms (user_id, id, name) VALUES (@UserId, @Id, @Name);", platform,
            cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 刪除指定使用者的平台（帳戶由外鍵串接刪除），回傳受影響列數。
    /// </summary>
    public async Task<int> DeletePlatformAsync(string id, long userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteAsync(new CommandDefinition(
            "DELETE FROM platforms WHERE id = @id AND user_id = @userId;", new { id, userId },
            cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 更新指定使用者的平台名稱，回傳受影響列數。
    /// </summary>
    public async Task<int> UpdatePlatformNameAsync(string id, long userId, string name, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteAsync(new CommandDefinition(
            "UPDATE platforms SET name = @name WHERE id = @id AND user_id = @userId;", new { id, userId, name },
            cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 更新指定使用者的帳戶名稱，回傳受影響列數。
    /// </summary>
    public async Task<int> UpdateAccountNameAsync(string id, long userId, string name, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteAsync(new CommandDefinition(
            "UPDATE accounts SET name = @name WHERE id = @id AND user_id = @userId;", new { id, userId, name },
            cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 新增帳戶（含 user_id）。
    /// </summary>
    public async Task InsertAccountAsync(AccountDataModel account, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(
            "INSERT INTO accounts (user_id, id, platform_id, name) VALUES (@UserId, @Id, @PlatformId, @Name);", account,
            cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 刪除指定使用者的帳戶，回傳受影響列數。
    /// </summary>
    public async Task<int> DeleteAccountAsync(string id, long userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteAsync(new CommandDefinition(
            "DELETE FROM accounts WHERE id = @id AND user_id = @userId;", new { id, userId },
            cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 為指定使用者新增商品代號（衝突時略過），回傳是否新增。
    /// </summary>
    public async Task<bool> InsertSymbolAsync(long userId, string ticker, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var affected = await connection.ExecuteAsync(new CommandDefinition(
            "INSERT INTO symbols (user_id, ticker) VALUES (@userId, @ticker) ON CONFLICT DO NOTHING;",
            new { userId, ticker }, cancellationToken: cancellationToken));
        return affected > 0;
    }

    /// <summary>
    /// 刪除指定使用者的商品代號，回傳受影響列數。
    /// </summary>
    public async Task<int> DeleteSymbolAsync(long userId, string ticker, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteAsync(new CommandDefinition(
            "DELETE FROM symbols WHERE user_id = @userId AND ticker = @ticker;",
            new { userId, ticker }, cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 為指定使用者新增標籤（衝突時略過），回傳是否新增。
    /// </summary>
    public async Task<bool> InsertTagAsync(long userId, string name, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var affected = await connection.ExecuteAsync(new CommandDefinition(
            "INSERT INTO tags (user_id, name) VALUES (@userId, @name) ON CONFLICT DO NOTHING;",
            new { userId, name }, cancellationToken: cancellationToken));
        return affected > 0;
    }

    /// <summary>
    /// 刪除指定使用者的標籤，回傳受影響列數。
    /// </summary>
    public async Task<int> DeleteTagAsync(long userId, string name, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteAsync(new CommandDefinition(
            "DELETE FROM tags WHERE user_id = @userId AND name = @name;",
            new { userId, name }, cancellationToken: cancellationToken));
    }
}
