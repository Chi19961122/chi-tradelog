using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Repositories.Data;
using Dapper;

namespace Chi.TradeLog.Repositories.Journal;

/// <summary>
/// 以 Dapper 實作的交易日記 Repository。
/// </summary>
public class JournalRepository : IJournalRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    private const string SelectSql = """
        SELECT account_id  AS AccountId,
               symbol      AS Symbol,
               day         AS Day,
               notes       AS Notes,
               emotions    AS Emotions,
               mistakes::text AS Mistakes
        FROM journal_entries
        WHERE account_id = @AccountId AND symbol = @Symbol AND day = @Day;
        """;

    private const string UpsertSql = """
        INSERT INTO journal_entries (account_id, symbol, day, notes, emotions, mistakes, updated_at)
        VALUES (@AccountId, @Symbol, @Day, @Notes, @Emotions, @Mistakes::jsonb, now())
        ON CONFLICT (account_id, symbol, day) DO UPDATE SET
            notes = EXCLUDED.notes,
            emotions = EXCLUDED.emotions,
            mistakes = EXCLUDED.mistakes,
            updated_at = now();
        """;

    /// <summary>
    /// 建立交易日記 Repository。
    /// </summary>
    public JournalRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    /// <summary>
    /// 依帳戶/商品/日期取得日記；找不到時回傳 <c>null</c>。
    /// </summary>
    public async Task<JournalEntryDataModel?> GetAsync(
        string accountId, string symbol, int day, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var command = new CommandDefinition(
            SelectSql, new { AccountId = accountId, Symbol = symbol, Day = day },
            cancellationToken: cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<JournalEntryDataModel>(command);
    }

    /// <summary>
    /// 新增或更新日記（upsert）。
    /// </summary>
    public async Task UpsertAsync(JournalEntryDataModel entry, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var command = new CommandDefinition(UpsertSql, entry, cancellationToken: cancellationToken);
        await connection.ExecuteAsync(command);
    }
}
