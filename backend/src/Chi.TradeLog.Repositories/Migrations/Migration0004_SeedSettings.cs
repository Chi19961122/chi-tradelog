using FluentMigrator;

namespace Chi.TradeLog.Repositories.Migrations;

/// <summary>
/// 設定資料的種子（Seed）— 與前端 uiStore 預設一致。
/// </summary>
[Migration(4, "植入設定種子資料")]
public class Migration0004_SeedSettings : Migration
{
    private static readonly string[] Symbols =
        ["AAPL", "TSLA", "NVDA", "MSFT", "QQQ", "AMD", "META", "AMZN", "SPY", "COIN", "NFLX", "GOOGL"];

    private static readonly string[] Tags =
        ["breakout", "earnings", "reversal", "trend", "news", "gap", "manual"];

    /// <summary>
    /// 植入平台、帳戶、商品、標籤與初始資金。
    /// </summary>
    public override void Up()
    {
        Insert.IntoTable("platforms").Row(new { id = "p1", name = "Interactive Brokers" });
        Insert.IntoTable("platforms").Row(new { id = "p2", name = "TD Ameritrade" });

        Insert.IntoTable("accounts").Row(new { id = "a1", platform_id = "p1", name = "Main" });
        Insert.IntoTable("accounts").Row(new { id = "a2", platform_id = "p1", name = "Paper" });
        Insert.IntoTable("accounts").Row(new { id = "a3", platform_id = "p2", name = "Individual" });

        foreach (var ticker in Symbols)
        {
            Insert.IntoTable("symbols").Row(new { ticker });
        }

        foreach (var name in Tags)
        {
            Insert.IntoTable("tags").Row(new { name });
        }

        Insert.IntoTable("app_settings").Row(new { id = 1, initial_capital = 10000m });
    }

    /// <summary>
    /// 清除種子資料。
    /// </summary>
    public override void Down()
    {
        Delete.FromTable("app_settings").Row(new { id = 1 });
        Delete.FromTable("tags").AllRows();
        Delete.FromTable("symbols").AllRows();
        Delete.FromTable("accounts").AllRows();
        Delete.FromTable("platforms").AllRows();
    }
}
