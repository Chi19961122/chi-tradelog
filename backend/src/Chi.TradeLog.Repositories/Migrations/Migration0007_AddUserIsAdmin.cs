using FluentMigrator;

namespace Chi.TradeLog.Repositories.Migrations;

/// <summary>
/// 為 <c>users</c> 加上 <c>is_admin</c> 欄位，並將示範帳號設為管理員。
/// </summary>
[Migration(7, "users 加入 is_admin 並設定示範管理員")]
public class Migration0007_AddUserIsAdmin : Migration
{
    /// <summary>
    /// 新增欄位並將 alex 設為管理員。
    /// </summary>
    public override void Up()
    {
        Alter.Table("users")
            .AddColumn("is_admin").AsBoolean().NotNullable().WithDefaultValue(false);

        Update.Table("users")
            .Set(new { is_admin = true })
            .Where(new { email = "alex@chitradelog.com" });
    }

    /// <summary>
    /// 移除欄位。
    /// </summary>
    public override void Down()
    {
        Delete.Column("is_admin").FromTable("users");
    }
}
