namespace Chi.TradeLog.Common.Options;

/// <summary>
/// 資料庫設定物件（Options）— 綁定 appsettings 的 <c>Database</c> 區段。
/// </summary>
public class DatabaseOptions
{
    /// <summary>
    /// 設定區段名稱。
    /// </summary>
    public const string SectionName = "Database";

    /// <summary>
    /// PostgreSQL 連線字串。
    /// </summary>
    public string ConnectionString { get; set; } = string.Empty;
}
