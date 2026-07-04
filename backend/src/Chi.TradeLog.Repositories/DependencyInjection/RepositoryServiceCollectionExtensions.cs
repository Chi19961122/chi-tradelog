using Chi.TradeLog.Common.Options;
using Chi.TradeLog.Repositories.Data;
using Chi.TradeLog.Repositories.Journal;
using Chi.TradeLog.Repositories.Migrations;
using Chi.TradeLog.Repositories.Settings;
using Chi.TradeLog.Repositories.Trades;
using Dapper;
using FluentMigrator.Runner;
using Microsoft.Extensions.DependencyInjection;

namespace Chi.TradeLog.Repositories.DependencyInjection;

/// <summary>
/// 資料存取層的 DI 註冊。
/// </summary>
public static class RepositoryServiceCollectionExtensions
{
    /// <summary>
    /// 註冊連線工廠、Repository 與 FluentMigrator。
    /// </summary>
    public static IServiceCollection AddDatabaseInfrastructure(
        this IServiceCollection services,
        string connectionString)
    {
        // Dapper 型別處理器：date ↔ DateOnly。
        SqlMapper.AddTypeHandler(new DateOnlyTypeHandler());

        services.Configure<DatabaseOptions>(options => options.ConnectionString = connectionString);

        services.AddSingleton<IDbConnectionFactory, NpgsqlConnectionFactory>();
        services.AddScoped<ITradeRepository, TradeRepository>();
        services.AddScoped<ISettingsRepository, SettingsRepository>();
        services.AddScoped<IJournalRepository, JournalRepository>();

        services
            .AddFluentMigratorCore()
            .ConfigureRunner(builder => builder
                .AddPostgres()
                .WithGlobalConnectionString(connectionString)
                .ScanIn(typeof(Migration0001_CreateTradesTable).Assembly).For.Migrations())
            .AddLogging(logging => logging.AddFluentMigratorConsole());

        return services;
    }

    /// <summary>
    /// 執行所有尚未套用的 migration（於應用程式啟動時呼叫）。
    /// </summary>
    public static void RunDatabaseMigrations(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var runner = scope.ServiceProvider.GetRequiredService<IMigrationRunner>();
        runner.MigrateUp();
    }
}
