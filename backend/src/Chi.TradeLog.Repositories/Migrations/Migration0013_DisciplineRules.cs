using FluentMigrator;

namespace Chi.TradeLog.Repositories.Migrations;

/// <summary>
/// 為 <c>app_settings</c> 加入每位使用者的紀律規則（JSON：單日最大筆數、報復性交易間隔分鐘）。
/// </summary>
[Migration(13, "app_settings 加入 discipline_rules")]
public class Migration0013_DisciplineRules : Migration
{
    /// <summary>
    /// 加入可為 NULL 的規則欄位（jsonb）。
    /// </summary>
    public override void Up()
    {
        Alter.Table("app_settings").AddColumn("discipline_rules").AsCustom("jsonb").Nullable();
    }

    /// <summary>
    /// 移除欄位。
    /// </summary>
    public override void Down()
    {
        Delete.Column("discipline_rules").FromTable("app_settings");
    }
}
