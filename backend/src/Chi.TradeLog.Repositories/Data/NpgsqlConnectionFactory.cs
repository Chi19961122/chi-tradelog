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

    /// <inheritdoc />
    public async Task<NpgsqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken = default)
    {
        var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        return connection;
    }
}
