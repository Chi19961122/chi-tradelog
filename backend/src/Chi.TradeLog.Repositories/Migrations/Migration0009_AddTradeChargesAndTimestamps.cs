using FluentMigrator;

namespace Chi.TradeLog.Repositories.Migrations;

/// <summary>
/// 為 <c>trades</c> 加入手續費與進／出場時間戳（皆可為 NULL，僅貼上匯入會填入），
/// 支援「貼上智慧匯入」保留券商報表的原始資訊。
/// </summary>
[Migration(9, "trades 加入 charges 與進出場時間戳")]
public class Migration0009_AddTradeChargesAndTimestamps : Migration
{
    /// <summary>
    /// 加入三個可為 NULL 的欄位（既有資料不受影響）。
    /// </summary>
    public override void Up()
    {
        Alter.Table("trades")
            .AddColumn("charges").AsDecimal(18, 2).Nullable()
            .AddColumn("opened_at").AsDateTimeOffset().Nullable()
            .AddColumn("closed_at").AsDateTimeOffset().Nullable();
    }

    /// <summary>
    /// 移除欄位。
    /// </summary>
    public override void Down()
    {
        Delete.Column("charges").FromTable("trades");
        Delete.Column("opened_at").FromTable("trades");
        Delete.Column("closed_at").FromTable("trades");
    }
}
