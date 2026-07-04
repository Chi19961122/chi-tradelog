using FluentMigrator;

namespace Chi.TradeLog.Repositories.Migrations;

/// <summary>
/// 建立設定相關資料表：platforms、accounts、symbols、tags、app_settings。
/// </summary>
[Migration(3, "建立設定相關資料表")]
public class Migration0003_CreateSettingsTables : Migration
{
    /// <summary>
    /// 建立資料表與外鍵。
    /// </summary>
    public override void Up()
    {
        Create.Table("platforms")
            .WithColumn("id").AsString(64).PrimaryKey()
            .WithColumn("name").AsString(128).NotNullable();

        Create.Table("accounts")
            .WithColumn("id").AsString(64).PrimaryKey()
            .WithColumn("platform_id").AsString(64).NotNullable()
            .WithColumn("name").AsString(128).NotNullable();

        Create.ForeignKey("fk_accounts_platform")
            .FromTable("accounts").ForeignColumn("platform_id")
            .ToTable("platforms").PrimaryColumn("id")
            .OnDelete(System.Data.Rule.Cascade);

        Create.Table("symbols")
            .WithColumn("ticker").AsString(32).PrimaryKey();

        Create.Table("tags")
            .WithColumn("name").AsString(64).PrimaryKey();

        Create.Table("app_settings")
            .WithColumn("id").AsInt32().PrimaryKey()
            .WithColumn("initial_capital").AsDecimal(18, 2).NotNullable();
    }

    /// <summary>
    /// 移除資料表。
    /// </summary>
    public override void Down()
    {
        Delete.Table("app_settings");
        Delete.Table("tags");
        Delete.Table("symbols");
        Delete.Table("accounts");
        Delete.Table("platforms");
    }
}
