using FluentMigrator;

namespace Chi.TradeLog.Repositories.Migrations;

/// <summary>
/// 建立 <c>trades</c> 資料表。
/// </summary>
[Migration(1, "建立 trades 資料表")]
public class Migration0001_CreateTradesTable : Migration
{
    public override void Up()
    {
        Create.Table("trades")
            .WithColumn("id").AsInt64().PrimaryKey().Identity()
            .WithColumn("account_id").AsString(64).NotNullable()
            .WithColumn("symbol").AsString(32).NotNullable()
            .WithColumn("side").AsString(8).NotNullable()
            .WithColumn("entry_price").AsDecimal(18, 4).NotNullable()
            .WithColumn("exit_price").AsDecimal(18, 4).NotNullable()
            .WithColumn("quantity").AsInt32().NotNullable()
            .WithColumn("pnl").AsDecimal(18, 2).NotNullable()
            .WithColumn("r_multiple").AsDecimal(10, 2).NotNullable()
            .WithColumn("traded_on").AsDate().NotNullable()
            .WithColumn("holding_minutes").AsInt32().NotNullable()
            .WithColumn("tags").AsCustom("text[]").NotNullable().WithDefaultValue("{}")
            .WithColumn("created_at").AsDateTimeOffset().NotNullable().WithDefault(SystemMethods.CurrentUTCDateTime)
            .WithColumn("updated_at").AsDateTimeOffset().NotNullable().WithDefault(SystemMethods.CurrentUTCDateTime);

        Create.Index("ix_trades_account_traded_on")
            .OnTable("trades")
            .OnColumn("account_id").Ascending()
            .OnColumn("traded_on").Descending();
    }

    public override void Down()
    {
        Delete.Table("trades");
    }
}
