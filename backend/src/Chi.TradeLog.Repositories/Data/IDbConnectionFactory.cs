using Npgsql;

namespace Chi.TradeLog.Repositories.Data;

/// <summary>
/// 資料庫連線工廠（Connection Factory）— 建立已開啟的 PostgreSQL 連線。
/// </summary>
public interface IDbConnectionFactory
{
    /// <summary>
    /// 建立並開啟一個 <see cref="NpgsqlConnection"/>。呼叫端負責釋放。
    /// </summary>
    Task<NpgsqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken = default);
}
