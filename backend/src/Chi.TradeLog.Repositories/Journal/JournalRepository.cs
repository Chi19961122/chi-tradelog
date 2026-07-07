using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Repositories.Data;
using Dapper;

namespace Chi.TradeLog.Repositories.Journal;

/// <summary>
/// 以 Dapper 實作的交易日記 Repository。所有查詢與寫入皆以 user_id 為範圍（多租戶隔離）。
/// </summary>
public class JournalRepository : IJournalRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    private const string SelectSql = """
        SELECT user_id     AS UserId,
               account_id  AS AccountId,
               symbol      AS Symbol,
               entry_date  AS EntryDate,
               notes       AS Notes,
               emotions    AS Emotions,
               mistakes::text AS Mistakes
        FROM journal_entries
        WHERE user_id = @UserId AND account_id = @AccountId AND symbol = @Symbol AND entry_date = @EntryDate;
        """;

    // 行為分析用：notes（HTML 含截圖 data URL）可能很大，這裡固定回空字串。
    private const string SelectAllByUserSql = """
        SELECT user_id     AS UserId,
               account_id  AS AccountId,
               symbol      AS Symbol,
               entry_date  AS EntryDate,
               ''          AS Notes,
               emotions    AS Emotions,
               mistakes::text AS Mistakes
        FROM journal_entries
        WHERE user_id = @UserId
        ORDER BY entry_date;
        """;

    // 全資料匯出用：含完整 notes。
    private const string SelectAllByUserWithNotesSql = """
        SELECT user_id     AS UserId,
               account_id  AS AccountId,
               symbol      AS Symbol,
               entry_date  AS EntryDate,
               notes       AS Notes,
               emotions    AS Emotions,
               mistakes::text AS Mistakes
        FROM journal_entries
        WHERE user_id = @UserId
        ORDER BY entry_date;
        """;

    private const string UpsertSql = """
        INSERT INTO journal_entries (user_id, account_id, symbol, entry_date, notes, emotions, mistakes, updated_at)
        VALUES (@UserId, @AccountId, @Symbol, @EntryDate, @Notes, @Emotions, @Mistakes::jsonb, now())
        ON CONFLICT (user_id, account_id, symbol, entry_date) DO UPDATE SET
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
    /// 依使用者/帳戶/商品/日期取得日記；找不到時回傳 <c>null</c>。
    /// </summary>
    public async Task<JournalEntryDataModel?> GetAsync(
        long userId, string accountId, string symbol, DateOnly date, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var command = new CommandDefinition(
            SelectSql, new { UserId = userId, AccountId = accountId, Symbol = symbol, EntryDate = date },
            cancellationToken: cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<JournalEntryDataModel>(command);
    }

    /// <summary>
    /// 新增或更新日記（upsert，衝突鍵含 user_id）。
    /// </summary>
    public async Task UpsertAsync(JournalEntryDataModel entry, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var command = new CommandDefinition(UpsertSql, entry, cancellationToken: cancellationToken);
        await connection.ExecuteAsync(command);
    }

    /// <summary>
    /// 取得指定使用者的全部日記，依日期由舊到新排序；預設不含 notes（匯出時帶入）。
    /// </summary>
    public async Task<IReadOnlyList<JournalEntryDataModel>> GetAllByUserAsync(
        long userId, bool includeNotes = false, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var command = new CommandDefinition(
            includeNotes ? SelectAllByUserWithNotesSql : SelectAllByUserSql,
            new { UserId = userId },
            cancellationToken: cancellationToken);
        var rows = await connection.QueryAsync<JournalEntryDataModel>(command);
        return rows.AsList();
    }
}
