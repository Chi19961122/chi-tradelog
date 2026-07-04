using FluentMigrator;

namespace Chi.TradeLog.Repositories.Migrations;

/// <summary>
/// 建立 <c>journal_entries</c> 資料表（交易日記，以帳戶/商品/日期為鍵）。
/// </summary>
[Migration(5, "建立 journal_entries 資料表")]
public class Migration0005_CreateJournalEntries : Migration
{
    /// <summary>
    /// 建立資料表與唯一鍵。
    /// </summary>
    public override void Up()
    {
        Create.Table("journal_entries")
            .WithColumn("id").AsInt64().PrimaryKey().Identity()
            .WithColumn("account_id").AsString(64).NotNullable()
            .WithColumn("symbol").AsString(32).NotNullable()
            .WithColumn("day").AsInt32().NotNullable()
            .WithColumn("notes").AsCustom("text").NotNullable().WithDefaultValue("")
            .WithColumn("emotions").AsCustom("text[]").NotNullable().WithDefaultValue("{}")
            .WithColumn("mistakes").AsCustom("jsonb").NotNullable().WithDefaultValue("[]")
            .WithColumn("updated_at").AsDateTimeOffset().NotNullable().WithDefault(SystemMethods.CurrentUTCDateTime);

        Create.UniqueConstraint("uq_journal_entry")
            .OnTable("journal_entries")
            .Columns("account_id", "symbol", "day");
    }

    /// <summary>
    /// 移除資料表。
    /// </summary>
    public override void Down()
    {
        Delete.Table("journal_entries");
    }
}
