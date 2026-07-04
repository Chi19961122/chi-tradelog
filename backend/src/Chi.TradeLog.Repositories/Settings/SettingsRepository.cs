using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Repositories.Data;
using Dapper;

namespace Chi.TradeLog.Repositories.Settings;

/// <summary>
/// 以 Dapper 實作的設定 Repository。
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
    /// 取得所有平台，依名稱排序。
    /// </summary>
    public async Task<IReadOnlyList<PlatformDataModel>> GetPlatformsAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var rows = await connection.QueryAsync<PlatformDataModel>(new CommandDefinition(
            "SELECT id AS Id, name AS Name FROM platforms ORDER BY name;", cancellationToken: cancellationToken));
        return rows.AsList();
    }

    /// <summary>
    /// 取得所有帳戶。
    /// </summary>
    public async Task<IReadOnlyList<AccountDataModel>> GetAccountsAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var rows = await connection.QueryAsync<AccountDataModel>(new CommandDefinition(
            "SELECT id AS Id, platform_id AS PlatformId, name AS Name FROM accounts ORDER BY name;",
            cancellationToken: cancellationToken));
        return rows.AsList();
    }

    /// <summary>
    /// 取得所有商品代號。
    /// </summary>
    public async Task<IReadOnlyList<string>> GetSymbolsAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var rows = await connection.QueryAsync<string>(new CommandDefinition(
            "SELECT ticker FROM symbols ORDER BY ticker;", cancellationToken: cancellationToken));
        return rows.AsList();
    }

    /// <summary>
    /// 取得所有標籤。
    /// </summary>
    public async Task<IReadOnlyList<string>> GetTagsAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var rows = await connection.QueryAsync<string>(new CommandDefinition(
            "SELECT name FROM tags ORDER BY name;", cancellationToken: cancellationToken));
        return rows.AsList();
    }

    /// <summary>
    /// 取得初始資金（無資料時回傳 0）。
    /// </summary>
    public async Task<decimal> GetInitialCapitalAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteScalarAsync<decimal>(new CommandDefinition(
            "SELECT initial_capital FROM app_settings WHERE id = 1;", cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 更新初始資金，回傳受影響列數。
    /// </summary>
    public async Task<int> UpdateInitialCapitalAsync(decimal value, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteAsync(new CommandDefinition(
            "UPDATE app_settings SET initial_capital = @value WHERE id = 1;", new { value },
            cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 判斷平台是否存在。
    /// </summary>
    public async Task<bool> PlatformExistsAsync(string id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(
            "SELECT EXISTS(SELECT 1 FROM platforms WHERE id = @id);", new { id },
            cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 新增平台。
    /// </summary>
    public async Task InsertPlatformAsync(PlatformDataModel platform, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(
            "INSERT INTO platforms (id, name) VALUES (@Id, @Name);", platform,
            cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 刪除平台（帳戶由外鍵串接刪除），回傳受影響列數。
    /// </summary>
    public async Task<int> DeletePlatformAsync(string id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteAsync(new CommandDefinition(
            "DELETE FROM platforms WHERE id = @id;", new { id }, cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 新增帳戶。
    /// </summary>
    public async Task InsertAccountAsync(AccountDataModel account, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(
            "INSERT INTO accounts (id, platform_id, name) VALUES (@Id, @PlatformId, @Name);", account,
            cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 刪除帳戶，回傳受影響列數。
    /// </summary>
    public async Task<int> DeleteAccountAsync(string id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteAsync(new CommandDefinition(
            "DELETE FROM accounts WHERE id = @id;", new { id }, cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 新增商品代號（衝突時略過），回傳是否新增。
    /// </summary>
    public async Task<bool> InsertSymbolAsync(string ticker, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var affected = await connection.ExecuteAsync(new CommandDefinition(
            "INSERT INTO symbols (ticker) VALUES (@ticker) ON CONFLICT DO NOTHING;", new { ticker },
            cancellationToken: cancellationToken));
        return affected > 0;
    }

    /// <summary>
    /// 刪除商品代號，回傳受影響列數。
    /// </summary>
    public async Task<int> DeleteSymbolAsync(string ticker, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteAsync(new CommandDefinition(
            "DELETE FROM symbols WHERE ticker = @ticker;", new { ticker }, cancellationToken: cancellationToken));
    }

    /// <summary>
    /// 新增標籤（衝突時略過），回傳是否新增。
    /// </summary>
    public async Task<bool> InsertTagAsync(string name, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var affected = await connection.ExecuteAsync(new CommandDefinition(
            "INSERT INTO tags (name) VALUES (@name) ON CONFLICT DO NOTHING;", new { name },
            cancellationToken: cancellationToken));
        return affected > 0;
    }

    /// <summary>
    /// 刪除標籤，回傳受影響列數。
    /// </summary>
    public async Task<int> DeleteTagAsync(string name, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        return await connection.ExecuteAsync(new CommandDefinition(
            "DELETE FROM tags WHERE name = @name;", new { name }, cancellationToken: cancellationToken));
    }
}
