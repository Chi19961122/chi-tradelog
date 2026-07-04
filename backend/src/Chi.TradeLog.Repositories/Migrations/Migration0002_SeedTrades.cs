using System.Globalization;
using System.Text;
using FluentMigrator;

namespace Chi.TradeLog.Repositories.Migrations;

/// <summary>
/// 種子資料（Seed）— 以與前端相同的確定性演算法產生示範交易，
/// 讓前端從 mock 切換到 API 後呈現一致的資料。
/// </summary>
[Migration(2, "植入示範交易資料")]
public class Migration0002_SeedTrades : Migration
{
    private static readonly string[] Symbols =
        ["AAPL", "TSLA", "NVDA", "MSFT", "QQQ", "AMD", "META", "AMZN", "SPY", "COIN", "NFLX", "GOOGL"];

    private static readonly string[] TagPool =
        ["breakout", "earnings", "reversal", "trend", "news", "gap"];

    // 與前端 uiStore 預設的帳戶對應。
    private static readonly string[] AccountIds = ["a1", "a2", "a3"];

    public override void Up()
    {
        var sql = new StringBuilder();
        foreach (var accountId in AccountIds)
        {
            AppendAccountInserts(sql, accountId);
        }

        Execute.Sql(sql.ToString());
    }

    public override void Down()
    {
        Execute.Sql($"DELETE FROM trades WHERE account_id = ANY(ARRAY[{string.Join(',', AccountIds.Select(a => $"'{a}'"))}]::text[]);");
    }

    /// <summary>
    /// 與前端 seededRand 相同的確定性亂數。
    /// </summary>
    private static double SeededRand(double seed)
    {
        var r = Math.Sin(seed * 12.9898) * 43758.5453;
        return r - Math.Floor(r);
    }

    /// <summary>
    /// 與前端 accountSeed 相同：由 accountId 推導 seed offset。
    /// </summary>
    private static int AccountSeed(string accountId)
    {
        var h = 0;
        foreach (var ch in accountId)
        {
            h = (h * 31 + ch) % 97;
        }
        return h;
    }

    private static void AppendAccountInserts(StringBuilder sql, string accountId)
    {
        var off = AccountSeed(accountId);
        for (var i = 0; i < 24; i++)
        {
            var seed = i + 1 + off * 41.7;
            var symbol = Symbols[(i + off) % Symbols.Length];
            var side = SeededRand(seed * 3.1) > 0.45 ? "Long" : "Short";
            var win = SeededRand(seed * 7.7) > 0.4;
            var r = win
                ? 0.4 + SeededRand(seed * 5.3) * 3.2
                : -(0.2 + SeededRand(seed * 9.1) * 1.4);
            var pnl = r * (80 + SeededRand(seed * 2.2) * 60);
            var entry = 40 + SeededRand(seed * 1.7) * 400;
            var exit = entry + (side == "Long" ? pnl / 10 : -pnl / 10);
            var qty = 10 + (int)Math.Floor(SeededRand(seed * 4.4) * 90 + 0.5);
            var day = 1 + (int)Math.Floor(SeededRand(seed * 6.6) * 30);
            var tag = TagPool[i % TagPool.Length];
            var holdingMinutes = (int)Math.Floor(
                3 + SeededRand(seed * 11.3) * (SeededRand(seed * 13.1) > 0.7 ? 600 : 90) + 0.5);

            sql.Append("INSERT INTO trades (account_id, symbol, side, entry_price, exit_price, quantity, pnl, r_multiple, traded_on, holding_minutes, tags) VALUES (");
            sql.Append('\'').Append(accountId).Append("', ");
            sql.Append('\'').Append(symbol).Append("', ");
            sql.Append('\'').Append(side).Append("', ");
            sql.Append(Num(entry, 4)).Append(", ");
            sql.Append(Num(exit, 4)).Append(", ");
            sql.Append(qty).Append(", ");
            sql.Append(Num(pnl, 2)).Append(", ");
            sql.Append(Num(r, 2)).Append(", ");
            sql.Append("DATE '2026-07-").Append(day.ToString("00", CultureInfo.InvariantCulture)).Append("', ");
            sql.Append(holdingMinutes).Append(", ");
            sql.Append("'{").Append(tag).Append("}'");
            sql.AppendLine(");");
        }
    }

    private static string Num(double value, int digits) =>
        Math.Round(value, digits, MidpointRounding.AwayFromZero)
            .ToString("F" + digits, CultureInfo.InvariantCulture);
}
