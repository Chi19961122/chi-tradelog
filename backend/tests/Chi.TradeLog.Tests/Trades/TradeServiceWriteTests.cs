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

public class TradeServiceWriteTests
{
    private static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(
            cfg => cfg.AddProfile<ServiceMappingProfile>(),
            NullLoggerFactory.Instance);
        return config.CreateMapper();
    }

    [Fact]
    public async Task CreateTradeAsync_ComputesPnlAndRAndDate_ForLong()
    {
        var repository = new CapturingTradeRepository(newId: 99);
        var service = new TradeService(repository, CreateMapper());
        var info = new SaveTradeInfo
        {
            AccountId = "a1",
            Sym = "aapl",
            Side = "Long",
            Entry = 100m,
            Exit = 110m,
            Qty = 20,
            Day = 15,
            Tags = [],
        };

        var dto = await service.CreateTradeAsync(info);

        // pnl = (110 - 100) * 20 = 200；r = 200 / 100 = 2
        dto.Id.Should().Be(99);
        dto.Symbol.Should().Be("AAPL");
        dto.Pnl.Should().Be(200m);
        dto.RMultiple.Should().Be(2m);
        dto.TradedOn.Should().Be(new DateOnly(2026, 7, 15));
        dto.Tags.Should().ContainSingle().Which.Should().Be("manual");
        repository.Inserted!.AccountId.Should().Be("a1");
    }

    [Fact]
    public async Task CreateTradeAsync_NegativePnl_ForShortWhenPriceRises()
    {
        var repository = new CapturingTradeRepository(newId: 1);
        var service = new TradeService(repository, CreateMapper());
        var info = new SaveTradeInfo
        {
            AccountId = "a1",
            Sym = "TSLA",
            Side = "Short",
            Entry = 100m,
            Exit = 120m,
            Qty = 10,
            Day = 3,
            Tags = ["news"],
        };

        var dto = await service.CreateTradeAsync(info);

        // Short：pnl = (100 - 120) * 10 = -200
        dto.Pnl.Should().Be(-200m);
        dto.RMultiple.Should().Be(-2m);
        dto.Tags.Should().ContainSingle().Which.Should().Be("news");
    }

    [Fact]
    public async Task UpdateTradeAsync_ReturnsNull_WhenNotFound()
    {
        var repository = new CapturingTradeRepository(newId: 1) { ExistingById = null };
        var service = new TradeService(repository, CreateMapper());

        var result = await service.UpdateTradeAsync(
            404,
            new SaveTradeInfo { Sym = "AAPL", Side = "Long", Entry = 1m, Exit = 2m, Qty = 1, Day = 1 });

        result.Should().BeNull();
    }

    [Fact]
    public async Task DeleteTradeAsync_ReturnsTrue_WhenRowAffected()
    {
        var repository = new CapturingTradeRepository(newId: 1) { DeleteAffected = 1 };
        var service = new TradeService(repository, CreateMapper());

        var deleted = await service.DeleteTradeAsync(5);

        deleted.Should().BeTrue();
    }

    private class CapturingTradeRepository : ITradeRepository
    {
        private readonly long _newId;

        public CapturingTradeRepository(long newId)
        {
            _newId = newId;
        }

        public TradeDataModel? Inserted { get; private set; }
        public TradeDataModel? ExistingById { get; set; } = new() { Id = 1, AccountId = "a1" };
        public int DeleteAffected { get; set; }

        public Task<IReadOnlyList<TradeDataModel>> GetByAccountsAsync(
            TradeQueryCondition condition, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<TradeDataModel>>([]);

        public Task<long> InsertAsync(TradeDataModel trade, CancellationToken cancellationToken = default)
        {
            Inserted = trade;
            return Task.FromResult(_newId);
        }

        public Task<int> UpdateAsync(TradeDataModel trade, CancellationToken cancellationToken = default)
            => Task.FromResult(1);

        public Task<TradeDataModel?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
            => Task.FromResult(ExistingById);

        public Task<int> DeleteAsync(long id, CancellationToken cancellationToken = default)
            => Task.FromResult(DeleteAffected);
    }
}
