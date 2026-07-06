using AutoMapper;
using Chi.TradeLog.Common.Models.Conditions;
using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Repositories.Trades;
using Chi.TradeLog.Services.Mapping;
using Chi.TradeLog.Services.Trades;
using Chi.TradeLog.Tests.TestDoubles;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Chi.TradeLog.Tests.Trades;

public class TradeServiceWriteTests
{
    private const long UserId = 1;

    private static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(
            cfg => cfg.AddProfile<ServiceMappingProfile>(),
            NullLoggerFactory.Instance);
        return config.CreateMapper();
    }

    private static TradeService CreateService(CapturingTradeRepository repository, StubSettingsRepository? settings = null)
        => new(repository, settings ?? new StubSettingsRepository(), CreateMapper());

    [Fact]
    public async Task CreateTradeAsync_ComputesPnlAndRAndDate_ForLong()
    {
        var repository = new CapturingTradeRepository(newId: 99);
        var service = CreateService(repository);
        var info = new SaveTradeInfo
        {
            UserId = UserId,
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
        dto.Should().NotBeNull();
        dto!.Id.Should().Be(99);
        dto.Symbol.Should().Be("AAPL");
        dto.Pnl.Should().Be(200m);
        dto.RMultiple.Should().Be(2m);
        // 交易日期以執行當下的年月為基準。
        var now = DateTime.UtcNow;
        dto.TradedOn.Should().Be(new DateOnly(now.Year, now.Month, 15));
        dto.Tags.Should().ContainSingle().Which.Should().Be("manual");
        repository.Inserted!.AccountId.Should().Be("a1");
        repository.Inserted.UserId.Should().Be(UserId);
    }

    [Fact]
    public async Task CreateTradeAsync_NegativePnl_ForShortWhenPriceRises()
    {
        var repository = new CapturingTradeRepository(newId: 1);
        var service = CreateService(repository);
        var info = new SaveTradeInfo
        {
            UserId = UserId,
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
        dto.Should().NotBeNull();
        dto!.Pnl.Should().Be(-200m);
        dto.RMultiple.Should().Be(-2m);
        dto.Tags.Should().ContainSingle().Which.Should().Be("news");
    }

    [Fact]
    public async Task CreateTradeAsync_ReturnsNull_WhenAccountNotOwnedByUser()
    {
        var repository = new CapturingTradeRepository(newId: 1);
        var service = CreateService(repository, new StubSettingsRepository { AccountExists = false });

        var dto = await service.CreateTradeAsync(new SaveTradeInfo
        {
            UserId = UserId,
            AccountId = "someone-elses-account",
            Sym = "AAPL",
            Side = "Long",
            Entry = 1m,
            Exit = 2m,
            Qty = 1,
            Day = 1,
        });

        dto.Should().BeNull();
        repository.Inserted.Should().BeNull(); // 未寫入任何資料
    }

    [Fact]
    public async Task UpdateTradeAsync_ReturnsNull_WhenNotFound()
    {
        var repository = new CapturingTradeRepository(newId: 1) { ExistingById = null };
        var service = CreateService(repository);

        var result = await service.UpdateTradeAsync(
            404,
            new SaveTradeInfo { UserId = UserId, Sym = "AAPL", Side = "Long", Entry = 1m, Exit = 2m, Qty = 1, Day = 1 });

        result.Should().BeNull();
    }

    [Fact]
    public async Task ImportTradesAsync_BuildsDataModelsWithAccountAndReturnsCount()
    {
        var repository = new CapturingTradeRepository(newId: 1);
        var service = CreateService(repository);
        var infos = new[]
        {
            new SaveTradeInfo { Sym = "aapl", Side = "Long", Entry = 100m, Exit = 110m, Qty = 10, Day = 5, Tags = ["breakout"] },
            new SaveTradeInfo { Sym = "tsla", Side = "Short", Entry = 200m, Exit = 190m, Qty = 5, Day = 8, Tags = [] },
        };

        var imported = await service.ImportTradesAsync(UserId, "a1", infos);

        imported.Should().Be(2);
        repository.InsertedMany.Should().HaveCount(2);
        repository.InsertedMany!.Should().OnlyContain(t => t.AccountId == "a1" && t.UserId == UserId);
        repository.InsertedMany![0].Symbol.Should().Be("AAPL"); // 正規化為大寫
        repository.InsertedMany![0].Pnl.Should().Be(100m); // (110 - 100) * 10
    }

    [Fact]
    public async Task ImportTradesAsync_ReturnsNull_WhenAccountNotOwnedByUser()
    {
        var repository = new CapturingTradeRepository(newId: 1);
        var service = CreateService(repository, new StubSettingsRepository { AccountExists = false });

        var imported = await service.ImportTradesAsync(
            UserId,
            "someone-elses-account",
            [new SaveTradeInfo { Sym = "AAPL", Side = "Long", Entry = 1m, Exit = 2m, Qty = 1, Day = 1 }]);

        imported.Should().BeNull();
        repository.InsertedMany.Should().BeNull(); // 未寫入任何資料
    }

    [Fact]
    public async Task DeleteTradeAsync_ReturnsTrue_WhenRowAffected()
    {
        var repository = new CapturingTradeRepository(newId: 1) { DeleteAffected = 1 };
        var service = CreateService(repository);

        var deleted = await service.DeleteTradeAsync(5, UserId);

        deleted.Should().BeTrue();
        repository.DeletedUserId.Should().Be(UserId); // 刪除有帶入使用者範圍
    }

    private class CapturingTradeRepository : ITradeRepository
    {
        private readonly long _newId;

        public CapturingTradeRepository(long newId)
        {
            _newId = newId;
        }

        public TradeDataModel? Inserted { get; private set; }
        public IReadOnlyList<TradeDataModel>? InsertedMany { get; private set; }
        public TradeDataModel? ExistingById { get; set; } = new() { Id = 1, UserId = 1, AccountId = "a1" };
        public int DeleteAffected { get; set; }
        public long? DeletedUserId { get; private set; }

        public Task<IReadOnlyList<TradeDataModel>> GetByAccountsAsync(
            TradeQueryCondition condition, CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<TradeDataModel>>([]);

        public Task<long> InsertAsync(TradeDataModel trade, CancellationToken cancellationToken = default)
        {
            Inserted = trade;
            return Task.FromResult(_newId);
        }

        public Task<int> InsertManyAsync(IReadOnlyList<TradeDataModel> trades, CancellationToken cancellationToken = default)
        {
            InsertedMany = trades;
            return Task.FromResult(trades.Count);
        }

        public Task<int> UpdateAsync(TradeDataModel trade, CancellationToken cancellationToken = default)
            => Task.FromResult(1);

        public Task<TradeDataModel?> GetByIdAsync(long id, long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(ExistingById);

        public Task<int> DeleteAsync(long id, long userId, CancellationToken cancellationToken = default)
        {
            DeletedUserId = userId;
            return Task.FromResult(DeleteAffected);
        }
    }
}
