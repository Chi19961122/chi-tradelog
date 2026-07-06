using Chi.TradeLog.Common.Models.Conditions;
using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Repositories.Data;
using Dapper;

namespace Chi.TradeLog.Repositories.Trades;

/// <summary>
/// 以 Dapper 實作的交易 Repository。所有查詢與寫入皆以 user_id 為範圍（多租戶隔離）。
/// </summary>
public class TradeRepository : ITradeRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    // snake_case 欄位以 AS 明確對應到 DataModel 的 PascalCase 屬性。
    private const string SelectColumns = """
        id              AS Id,
        user_id         AS UserId,
        account_id      AS AccountId,
        symbol          AS Symbol,
        side            AS Side,
        entry_price     AS EntryPrice,
        exit_price      AS ExitPrice,
        quantity        AS Quantity,
        pnl             AS Pnl,
        r_multiple      AS RMultiple,
        traded_on       AS TradedOn,
        holding_minutes AS HoldingMinutes,
        tags            AS Tags
        """;

    private const string SelectByAccountsSql = $"""
        SELECT {SelectColumns}
        FROM trades
        WHERE user_id = @UserId AND account_id = ANY(@AccountIds)
        ORDER BY traded_on DESC, id DESC;
        """;

    private const string SelectByIdSql = $"""
        SELECT {SelectColumns}
        FROM trades
        WHERE id = @Id AND user_id = @UserId;
        """;

    private const string InsertSql = """
        INSERT INTO trades
            (user_id, account_id, symbol, side, entry_price, exit_price, quantity, pnl, r_multiple, traded_on, holding_minutes, tags)
        VALUES
            (@UserId, @AccountId, @Symbol, @Side, @EntryPrice, @ExitPrice, @Quantity, @Pnl, @RMultiple, @TradedOn, @HoldingMinutes, @Tags)
        RETURNING id;
        """;

    private const string UpdateSql = """
        UPDATE trades SET
            symbol = @Symbol,
            side = @Side,
            entry_price = @EntryPrice,
            exit_price = @ExitPrice,
            quantity = @Quantity,
            pnl = @Pnl,
            r_multiple = @RMultiple,
            traded_on = @TradedOn,
            holding_minutes = @HoldingMinutes,
            tags = @Tags,
            updated_at = now()
        WHERE id = @Id AND user_id = @UserId;
        """;

    private const string DeleteSql = "DELETE FROM trades WHERE id = @Id AND user_id = @UserId;";

    /// <summary>
    /// 建立交易 Repository。
    /// </summary>
    public TradeRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    /// <summary>
    /// 依使用者與帳戶查詢交易，依交易日期由新到舊排序。
    /// </summary>
    public async Task<IReadOnlyList<TradeDataModel>> GetByAccountsAsync(
        TradeQueryCondition condition,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var command = new CommandDefinition(
            SelectByAccountsSql,
            new { condition.UserId, AccountIds = condition.AccountIds.ToArray() },
            cancellationToken: cancellationToken);

        var rows = await connection.QueryAsync<TradeDataModel>(command);
        return rows.AsList();
    }

    /// <summary>
    /// 新增一筆交易（含 user_id），回傳新產生的主鍵。
    /// </summary>
    public async Task<long> InsertAsync(TradeDataModel trade, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var command = new CommandDefinition(InsertSql, trade, cancellationToken: cancellationToken);
        return await connection.ExecuteScalarAsync<long>(command);
    }

    /// <summary>
    /// 於單一 transaction 中批次新增多筆交易，回傳新增筆數。
    /// </summary>
    public async Task<int> InsertManyAsync(IReadOnlyList<TradeDataModel> trades, CancellationToken cancellationToken = default)
    {
        if (trades.Count == 0)
        {
            return 0;
        }

        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        // Dapper 對清單參數會於同一連線／交易內逐筆執行同一段 SQL。
        var command = new CommandDefinition(InsertSql, trades, transaction, cancellationToken: cancellationToken);
        var affected = await connection.ExecuteAsync(command);
        await transaction.CommitAsync(cancellationToken);
        return affected;
    }

    /// <summary>
    /// 更新指定交易（僅限資料所屬使用者），回傳受影響的列數。
    /// </summary>
    public async Task<int> UpdateAsync(TradeDataModel trade, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var command = new CommandDefinition(UpdateSql, trade, cancellationToken: cancellationToken);
        return await connection.ExecuteAsync(command);
    }

    /// <summary>
    /// 依主鍵取得指定使用者的單筆交易；找不到時回傳 <c>null</c>。
    /// </summary>
    public async Task<TradeDataModel?> GetByIdAsync(long id, long userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var command = new CommandDefinition(SelectByIdSql, new { Id = id, UserId = userId }, cancellationToken: cancellationToken);
        return await connection.QuerySingleOrDefaultAsync<TradeDataModel>(command);
    }

    /// <summary>
    /// 刪除指定使用者的指定交易，回傳受影響的列數。
    /// </summary>
    public async Task<int> DeleteAsync(long id, long userId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var command = new CommandDefinition(DeleteSql, new { Id = id, UserId = userId }, cancellationToken: cancellationToken);
        return await connection.ExecuteAsync(command);
    }
}
