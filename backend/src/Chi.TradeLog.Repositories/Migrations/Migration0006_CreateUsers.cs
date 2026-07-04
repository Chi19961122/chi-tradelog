using FluentMigrator;

namespace Chi.TradeLog.Repositories.Migrations;

/// <summary>
/// 建立 <c>users</c> 資料表並植入示範使用者。
/// </summary>
[Migration(6, "建立 users 資料表並植入示範使用者")]
public class Migration0006_CreateUsers : Migration
{
    // 示範帳號：alex@chitradelog.com / demo1234
    private const string DemoEmail = "alex@chitradelog.com";
    private const string DemoPassword = "demo1234";
    private const string DemoName = "Alex Chen";

    /// <summary>
    /// 建立資料表並植入示範使用者（密碼以 BCrypt 雜湊）。
    /// </summary>
    public override void Up()
    {
        Create.Table("users")
            .WithColumn("id").AsInt64().PrimaryKey().Identity()
            .WithColumn("email").AsString(256).NotNullable().Unique()
            .WithColumn("password_hash").AsString(256).NotNullable()
            .WithColumn("display_name").AsString(128).NotNullable()
            .WithColumn("created_at").AsDateTimeOffset().NotNullable().WithDefault(SystemMethods.CurrentUTCDateTime);

        var hash = BCrypt.Net.BCrypt.HashPassword(DemoPassword);
        Insert.IntoTable("users").Row(new
        {
            email = DemoEmail,
            password_hash = hash,
            display_name = DemoName,
        });
    }

    /// <summary>
    /// 移除資料表。
    /// </summary>
    public override void Down()
    {
        Delete.Table("users");
    }
}
