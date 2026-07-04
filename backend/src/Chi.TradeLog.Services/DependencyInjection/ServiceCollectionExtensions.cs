using Chi.TradeLog.Services.Settings;
using Chi.TradeLog.Services.Trades;
using Microsoft.Extensions.DependencyInjection;

namespace Chi.TradeLog.Services.DependencyInjection;

/// <summary>
/// 業務邏輯層的 DI 註冊。
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// 註冊所有 Service。
    /// </summary>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<ITradeService, TradeService>();
        services.AddScoped<ISettingsService, SettingsService>();
        return services;
    }
}
