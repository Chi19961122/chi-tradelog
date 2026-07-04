using AutoMapper;
using Chi.TradeLog.Common.Models.Conditions;
using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Repositories.Trades;
using Chi.TradeLog.Services.Mapping;
using Chi.TradeLog.Services.Trades;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Chi.TradeLog.Tests.Trades;

public class TradeServiceTests
{
    private static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(
            cfg => cfg.AddProfile<ServiceMappingProfile>(),
            NullLoggerFactory.Instance);
        return config.CreateMapper();
    }

    [Fact]
    public async Task GetTradesAsync_MapsDataModelsToDtos_AndPassesAccountIds()
    {
        // Arrange
        var repository = new FakeTradeRepository(
        [
            new TradeDataModel
            {
                Id = 7,
                AccountId = "a1",
                Symbol = "AAPL",
                Side = "Long",
                EntryPrice = 100.25m,
                ExitPrice = 105.50m,
                Quantity = 30,
                Pnl = 157.50m,
                RMultiple = 1.5m,
                TradedOn = new DateOnly(2026, 7, 12),
                HoldingMinutes = 42,
                Tags = ["breakout"],
            },
        ]);
        var service = new TradeService(repository, CreateMapper());
        var info = new TradeQueryInfo { AccountIds = ["a1"] };

        // Act
        var result = await service.GetTradesAsync(info);

        // Assert
        result.Should().HaveCount(1);
        var dto = result[0];
        dto.Id.Should().Be(7);
        dto.Symbol.Should().Be("AAPL");
        dto.Pnl.Should().Be(157.50m);
        dto.Tags.Should().ContainSingle().Which.Should().Be("breakout");
        repository.LastCondition!.AccountIds.Should().ContainSingle().Which.Should().Be("a1");
    }

    /// <summary>
    /// 假的 Repository，記錄最後一次查詢條件並回傳預設資料。
    /// </summary>
    private class FakeTradeRepository : ITradeRepository
    {
        private readonly IReadOnlyList<TradeDataModel> _rows;

        public FakeTradeRepository(IReadOnlyList<TradeDataModel> rows)
        {
            _rows = rows;
        }

        public TradeQueryCondition? LastCondition { get; private set; }

        public Task<IReadOnlyList<TradeDataModel>> GetByAccountsAsync(
            TradeQueryCondition condition,
            CancellationToken cancellationToken = default)
        {
            LastCondition = condition;
            return Task.FromResult(_rows);
        }
    }
}
