using Chi.TradeLog.Common.Options;
using Microsoft.Extensions.Options;
using Npgsql;

namespace Chi.TradeLog.Repositories.Data;

/// <summary>
/// 以 Npgsql 實作的連線工廠。連線字串取自 <see cref="DatabaseOptions"/>。
/// </summary>
public class NpgsqlConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    /// <summary>
    /// 建立連線工廠。
    /// </summary>
    public NpgsqlConnectionFactory(IOptions<DatabaseOptions> options)
    {
        _connectionString = options.Value.ConnectionString;
    }

    /// <summary>
    /// 以設定的連線字串建立並開啟一個 <see cref="NpgsqlConnection"/>。呼叫端負責釋放。
    /// </summary>
    public async Task<NpgsqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken = default)
    {
        var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        return connection;
    }
}
