using FluentMigrator;

namespace Chi.TradeLog.Repositories.Migrations;

/// <summary>
/// 為 <c>app_settings</c> 加入每位使用者的日記範本（原本存在前端記憶體，重新整理即消失）。
/// </summary>
[Migration(11, "app_settings 加入 journal_template")]
public class Migration0011_JournalTemplate : Migration
{
    /// <summary>
    /// 加入可為 NULL 的範本欄位。
    /// </summary>
    public override void Up()
    {
        Alter.Table("app_settings").AddColumn("journal_template").AsCustom("text").Nullable();
    }

    /// <summary>
    /// 移除欄位。
    /// </summary>
    public override void Down()
    {
        Delete.Column("journal_template").FromTable("app_settings");
    }
}
