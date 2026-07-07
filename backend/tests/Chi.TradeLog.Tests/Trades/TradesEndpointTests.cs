using System.Net;
using System.Net.Http.Json;
using Chi.TradeLog.Common.Models.Conditions;
using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Repositories.Settings;
using Chi.TradeLog.Repositories.Trades;
using Chi.TradeLog.Tests.TestAuth;
using Chi.TradeLog.Tests.TestDoubles;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.AspNetCore.Hosting;
using Xunit;

namespace Chi.TradeLog.Tests.Trades;

public class TradesEndpointTests : IClassFixture<TradesEndpointTests.TestApiFactory>
{
    private readonly TestApiFactory _factory;

    public TradesEndpointTests(TestApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetTrades_WithAccountId_ReturnsMappedViewModels()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/trades?accountIds=a1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var trades = await response.Content.ReadFromJsonAsync<List<TradeViewModelResponse>>();
        trades.Should().NotBeNull();
        trades!.Should().ContainSingle();
        var trade = trades![0];
        trade.Sym.Should().Be("NVDA");
        trade.Side.Should().Be("Short");
        trade.Date.Should().Be("2026-07-09");
        trade.Tags.Should().ContainSingle().Which.Should().Be("trend");
    }

    [Fact]
    public async Task GetTrades_WithoutAccountIds_ReturnsBadRequest()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/trades");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateTrade_WithValidBody_Returns201AndComputedPnl()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/trades", new
        {
            accountId = "a1",
            sym = "aapl",
            side = "Long",
            entry = 100m,
            exit = 110m,
            qty = 10,
            date = "2026-07-08",
            tags = new[] { "breakout" },
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var trade = await response.Content.ReadFromJsonAsync<TradeViewModelResponse>();
        trade!.Sym.Should().Be("AAPL");
        trade.Pnl.Should().Be(100m); // (110 - 100) * 10
        trade.Date.Should().Be("2026-07-08");
    }

    [Fact]
    public async Task CreateTrade_WithInvalidBody_Returns400()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/trades", new
        {
            accountId = "a1",
            sym = "AAPL",
            side = "Long",
            entry = 100m,
            exit = 110m,
            qty = 0, // 無效
            date = "2026-07-08",
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeleteTrade_Returns204()
    {
        var client = _factory.CreateClient();

        var response = await client.DeleteAsync("/api/trades/1");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task GetTrades_PassesAuthenticatedUserIdToRepository()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/trades?accountIds=a1");

        // 多租戶隔離：Controller 應把 JWT sub 的使用者 ID 一路帶到 Repository 查詢條件。
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        StubTradeRepository.LastCondition.Should().NotBeNull();
        StubTradeRepository.LastCondition!.UserId.Should().Be(TestAuthHandler.TestUserId);
    }

    /// <summary>
    /// 覆寫 ITradeRepository 以脫離真實資料庫；環境設為 Testing 以略過 migration。
    /// </summary>
    public class TestApiFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<ITradeRepository>();
                services.AddScoped<ITradeRepository, StubTradeRepository>();

                // 帳戶歸屬檢查改用替身（避免依賴真實資料庫）。
                services.RemoveAll<ISettingsRepository>();
                services.AddScoped<ISettingsRepository, StubSettingsRepository>();

                // 以測試認證方案覆寫預設，讓受保護端點在測試中可存取。
                services
                    .AddAuthentication(TestAuthHandler.SchemeName)
                    .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, _ => { });
            });
        }
    }

    /// <summary>
    /// 回傳固定資料的 ITradeRepository 替身；記錄最後一次查詢條件供隔離測試檢查。
    /// </summary>
    private class StubTradeRepository : ITradeRepository
    {
        // 端點測試每個 request 建立新 scope，改以 static 讓測試可讀取最後一次條件。
        public static TradeQueryCondition? LastCondition { get; private set; }

        public Task<IReadOnlyList<TradeDataModel>> GetByAccountsAsync(
            TradeQueryCondition condition,
            CancellationToken cancellationToken = default)
        {
            LastCondition = condition;
            // 僅回傳屬於測試使用者（sub=1）的資料，模擬 SQL 的 user_id 過濾。
            IReadOnlyList<TradeDataModel> rows = condition.AccountIds.Contains("a1") && condition.UserId == TestAuthHandler.TestUserId
                ?
                [
                    new TradeDataModel
                    {
                        Id = 1,
                        AccountId = "a1",
                        Symbol = "NVDA",
                        Side = "Short",
                        EntryPrice = 420.10m,
                        ExitPrice = 405.60m,
                        Quantity = 25,
                        Pnl = -362.50m,
                        RMultiple = -1.2m,
                        TradedOn = new DateOnly(2026, 7, 9),
                        HoldingMinutes = 55,
                        Tags = ["trend"],
                    },
                ]
                : [];
            return Task.FromResult(rows);
        }

        public Task<long> InsertAsync(TradeDataModel trade, CancellationToken cancellationToken = default)
            => Task.FromResult(123L);

        public Task<int> InsertManyAsync(IReadOnlyList<TradeDataModel> trades, CancellationToken cancellationToken = default)
            => Task.FromResult(trades.Count);

        public Task<int> UpdateAsync(TradeDataModel trade, CancellationToken cancellationToken = default)
            => Task.FromResult(1);

        public Task<TradeDataModel?> GetByIdAsync(long id, long userId, CancellationToken cancellationToken = default)
            => Task.FromResult<TradeDataModel?>(new TradeDataModel { Id = id, UserId = userId, AccountId = "a1" });

        public Task<int> DeleteAsync(long id, long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(userId == TestAuthHandler.TestUserId ? 1 : 0);
    }

    /// <summary>
    /// 對應 API 的 ViewModel（camelCase JSON）。
    /// </summary>
    private class TradeViewModelResponse
    {
        public string Id { get; set; } = string.Empty;
        public string AccountId { get; set; } = string.Empty;
        public string Sym { get; set; } = string.Empty;
        public string Side { get; set; } = string.Empty;
        public decimal R { get; set; }
        public decimal Pnl { get; set; }
        public decimal Entry { get; set; }
        public decimal Exit { get; set; }
        public int Qty { get; set; }
        public string Date { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = [];
        public int HoldingMinutes { get; set; }
    }
}
