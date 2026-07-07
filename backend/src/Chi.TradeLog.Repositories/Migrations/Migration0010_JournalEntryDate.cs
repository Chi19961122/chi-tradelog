using FluentMigrator;

namespace Chi.TradeLog.Repositories.Migrations;

/// <summary>
/// 交易日記改用完整日期：`day`（當月第幾天）→ `entry_date`（date），
/// 避免跨月時不同月份的同日日記互相覆蓋（完整日期模型遷移的一環）。
/// </summary>
[Migration(10, "journal_entries 改用完整日期 entry_date")]
public class Migration0010_JournalEntryDate : Migration
{
    /// <summary>
    /// 加入 entry_date、以 2026-07 回填既有資料（皆於該月建立）、換唯一鍵並移除舊 day 欄。
    /// </summary>
    public override void Up()
    {
        Alter.Table("journal_entries").AddColumn("entry_date").AsDate().Nullable();
        Execute.Sql("UPDATE journal_entries SET entry_date = make_date(2026, 7, day) WHERE entry_date IS NULL;");
        Execute.Sql("ALTER TABLE journal_entries ALTER COLUMN entry_date SET NOT NULL;");
        Execute.Sql("""
            ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS uq_journal_entry;
            ALTER TABLE journal_entries ADD CONSTRAINT uq_journal_entry UNIQUE (user_id, account_id, symbol, entry_date);
            """);
        Delete.Column("day").FromTable("journal_entries");
    }

    /// <summary>
    /// 還原為 day（僅取日的部分，跨月資訊會遺失）。
    /// </summary>
    public override void Down()
    {
        Alter.Table("journal_entries").AddColumn("day").AsInt32().Nullable();
        Execute.Sql("UPDATE journal_entries SET day = EXTRACT(DAY FROM entry_date)::int;");
        Execute.Sql("ALTER TABLE journal_entries ALTER COLUMN day SET NOT NULL;");
        Execute.Sql("""
            ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS uq_journal_entry;
            ALTER TABLE journal_entries ADD CONSTRAINT uq_journal_entry UNIQUE (user_id, account_id, symbol, day);
            """);
        Delete.Column("entry_date").FromTable("journal_entries");
    }
}
