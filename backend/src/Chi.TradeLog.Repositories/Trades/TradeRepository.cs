using Chi.TradeLog.Common.Models.Conditions;
using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Repositories.Data;
using Dapper;

namespace Chi.TradeLog.Repositories.Trades;

/// <summary>
/// 以 Dapper 實作的交易 Repository。
/// </summary>
public class TradeRepository : ITradeRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    // snake_case 欄位以 AS 明確對應到 DataModel 的 PascalCase 屬性。
    private const string SelectByAccountsSql = """
        SELECT id              AS Id,
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
        FROM trades
        WHERE account_id = ANY(@AccountIds)
        ORDER BY traded_on DESC, id DESC;
        """;

    /// <summary>
    /// 建立交易 Repository。
    /// </summary>
    public TradeRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<TradeDataModel>> GetByAccountsAsync(
        TradeQueryCondition condition,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        var command = new CommandDefinition(
            SelectByAccountsSql,
            new { AccountIds = condition.AccountIds.ToArray() },
            cancellationToken: cancellationToken);

        var rows = await connection.QueryAsync<TradeDataModel>(command);
        return rows.AsList();
    }
}
