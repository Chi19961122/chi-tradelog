using FluentMigrator;

namespace Chi.TradeLog.Repositories.Migrations;

/// <summary>
/// 多租戶隔離：為所有使用者資料表加入 <c>user_id</c> 欄位並回填給示範使用者，
/// 同時調整主鍵／唯一鍵／索引，讓資料以使用者為範圍。
/// </summary>
[Migration(8, "加入 user_id 多租戶隔離")]
public class Migration0008_AddUserScoping : Migration
{
    // 需要加上 user_id 的使用者資料表（依相依順序）。
    private static readonly string[] UserTables =
        ["platforms", "accounts", "symbols", "tags", "app_settings", "journal_entries", "trades"];

    /// <summary>
    /// 加入 user_id（回填給示範使用者後設為 NOT NULL + FK），並調整鍵與索引。
    /// </summary>
    public override void Up()
    {
        foreach (var table in UserTables)
        {
            Alter.Table(table).AddColumn("user_id").AsInt64().Nullable();
            // 既有資料一律回填給示範使用者（migration 0006 建立）。
            Execute.Sql($"UPDATE {table} SET user_id = (SELECT id FROM users WHERE email = 'alex@chitradelog.com' LIMIT 1) WHERE user_id IS NULL;");
            Execute.Sql($"ALTER TABLE {table} ALTER COLUMN user_id SET NOT NULL;");
            // 刪除使用者時串接刪除其所有資料。
            Execute.Sql($"ALTER TABLE {table} ADD CONSTRAINT fk_{table}_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;");
        }

        // symbols / tags：主鍵改為複合鍵（user_id, 原鍵），讓不同使用者可各自擁有相同代號／名稱。
        Execute.Sql("""
            ALTER TABLE symbols DROP CONSTRAINT IF EXISTS "PK_symbols";
            ALTER TABLE symbols DROP CONSTRAINT IF EXISTS symbols_pkey;
            ALTER TABLE symbols ADD CONSTRAINT pk_symbols PRIMARY KEY (user_id, ticker);
            """);
        Execute.Sql("""
            ALTER TABLE tags DROP CONSTRAINT IF EXISTS "PK_tags";
            ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_pkey;
            ALTER TABLE tags ADD CONSTRAINT pk_tags PRIMARY KEY (user_id, name);
            """);

        // app_settings：由「單列固定 id=1」改為「每位使用者一列」，以 user_id 為主鍵。
        Execute.Sql("""
            ALTER TABLE app_settings DROP CONSTRAINT IF EXISTS "PK_app_settings";
            ALTER TABLE app_settings DROP CONSTRAINT IF EXISTS app_settings_pkey;
            ALTER TABLE app_settings DROP COLUMN id;
            ALTER TABLE app_settings ADD CONSTRAINT pk_app_settings PRIMARY KEY (user_id);
            """);

        // journal_entries：唯一鍵納入 user_id。
        Execute.Sql("""
            ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS uq_journal_entry;
            ALTER TABLE journal_entries ADD CONSTRAINT uq_journal_entry UNIQUE (user_id, account_id, symbol, day);
            """);

        // trades：查詢索引改以 user_id 開頭。
        Execute.Sql("""
            DROP INDEX IF EXISTS ix_trades_account_traded_on;
            CREATE INDEX ix_trades_user_account_traded_on ON trades (user_id, account_id, traded_on DESC);
            """);
    }

    /// <summary>
    /// 還原鍵與索引後移除各表的 user_id 欄位。
    /// </summary>
    public override void Down()
    {
        Execute.Sql("""
            DROP INDEX IF EXISTS ix_trades_user_account_traded_on;
            CREATE INDEX ix_trades_account_traded_on ON trades (account_id ASC, traded_on DESC);
            """);
        Execute.Sql("""
            ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS uq_journal_entry;
            ALTER TABLE journal_entries ADD CONSTRAINT uq_journal_entry UNIQUE (account_id, symbol, day);
            """);
        Execute.Sql("""
            ALTER TABLE app_settings DROP CONSTRAINT IF EXISTS pk_app_settings;
            ALTER TABLE app_settings ADD COLUMN id integer;
            UPDATE app_settings SET id = 1;
            ALTER TABLE app_settings ALTER COLUMN id SET NOT NULL;
            ALTER TABLE app_settings ADD CONSTRAINT pk_app_settings PRIMARY KEY (id);
            """);
        Execute.Sql("""
            ALTER TABLE tags DROP CONSTRAINT IF EXISTS pk_tags;
            ALTER TABLE tags ADD CONSTRAINT pk_tags PRIMARY KEY (name);
            """);
        Execute.Sql("""
            ALTER TABLE symbols DROP CONSTRAINT IF EXISTS pk_symbols;
            ALTER TABLE symbols ADD CONSTRAINT pk_symbols PRIMARY KEY (ticker);
            """);

        foreach (var table in UserTables.Reverse())
        {
            Execute.Sql($"ALTER TABLE {table} DROP CONSTRAINT IF EXISTS fk_{table}_user;");
            Delete.Column("user_id").FromTable(table);
        }
    }
}
