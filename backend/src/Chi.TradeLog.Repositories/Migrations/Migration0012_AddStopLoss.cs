using FluentMigrator;

namespace Chi.TradeLog.Repositories.Migrations;

/// <summary>
/// 為 <c>trades</c> 加入停損價（選填），讓 R 值可用真實風險計算
/// （R = pnl ÷ (|entry − stop| × qty)），無停損時維持近似值。
/// </summary>
[Migration(12, "trades 加入 stop_loss")]
public class Migration0012_AddStopLoss : Migration
{
    /// <summary>
    /// 加入可為 NULL 的停損價欄位。
    /// </summary>
    public override void Up()
    {
        Alter.Table("trades").AddColumn("stop_loss").AsDecimal(18, 4).Nullable();
    }

    /// <summary>
    /// 移除欄位。
    /// </summary>
    public override void Down()
    {
        Delete.Column("stop_loss").FromTable("trades");
    }
}
