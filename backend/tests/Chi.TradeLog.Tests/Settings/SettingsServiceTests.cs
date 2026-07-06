using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Repositories.Settings;
using Chi.TradeLog.Services.Settings;
using FluentAssertions;
using Xunit;

namespace Chi.TradeLog.Tests.Settings;

public class SettingsServiceTests
{
    private const long UserId = 1;

    [Fact]
    public async Task GetSettingsAsync_GroupsAccountsUnderPlatforms()
    {
        var repository = new FakeSettingsRepository
        {
            Platforms =
            [
                new PlatformDataModel { Id = "p1", Name = "IB" },
                new PlatformDataModel { Id = "p2", Name = "TD" },
            ],
            Accounts =
            [
                new AccountDataModel { Id = "a1", PlatformId = "p1", Name = "Main" },
                new AccountDataModel { Id = "a2", PlatformId = "p1", Name = "Paper" },
                new AccountDataModel { Id = "a3", PlatformId = "p2", Name = "Individual" },
            ],
            Symbols = ["AAPL", "TSLA"],
            Tags = ["breakout"],
            InitialCapital = 10000m,
        };
        var service = new SettingsService(repository);

        var settings = await service.GetSettingsAsync(UserId);

        settings.InitialCapital.Should().Be(10000m);
        settings.Platforms.Should().HaveCount(2);
        settings.Platforms.First(p => p.Id == "p1").Accounts.Should().HaveCount(2);
        settings.Platforms.First(p => p.Id == "p2").Accounts.Should().ContainSingle();
        settings.Symbols.Should().Contain("AAPL");
        settings.Tags.Should().ContainSingle().Which.Should().Be("breakout");
    }

    [Fact]
    public async Task GetSettingsAsync_DefaultsCapital_WhenUserHasNoRow()
    {
        var repository = new FakeSettingsRepository { InitialCapital = null };
        var service = new SettingsService(repository);

        var settings = await service.GetSettingsAsync(UserId);

        settings.InitialCapital.Should().Be(10000m);
    }

    [Fact]
    public async Task CreatePlatformAsync_GeneratesPrefixedId()
    {
        var repository = new FakeSettingsRepository();
        var service = new SettingsService(repository);

        var platform = await service.CreatePlatformAsync(UserId, new CreatePlatformInfo { Name = "  New Broker  " });

        platform.Id.Should().StartWith("p");
        platform.Name.Should().Be("New Broker");
        platform.Accounts.Should().BeEmpty();
        repository.InsertedPlatform!.Name.Should().Be("New Broker");
        repository.InsertedPlatform.UserId.Should().Be(UserId);
    }

    [Fact]
    public async Task CreateAccountAsync_ReturnsNull_WhenPlatformMissing()
    {
        var repository = new FakeSettingsRepository { PlatformExists = false };
        var service = new SettingsService(repository);

        var account = await service.CreateAccountAsync(UserId, new CreateAccountInfo { PlatformId = "nope", Name = "X" });

        account.Should().BeNull();
    }

    [Fact]
    public async Task AddSymbolAsync_NormalizesToUpper()
    {
        var repository = new FakeSettingsRepository();
        var service = new SettingsService(repository);

        await service.AddSymbolAsync(UserId, "  aapl ");

        repository.InsertedSymbol.Should().Be("AAPL");
    }

    private class FakeSettingsRepository : ISettingsRepository
    {
        public IReadOnlyList<PlatformDataModel> Platforms { get; set; } = [];
        public IReadOnlyList<AccountDataModel> Accounts { get; set; } = [];
        public IReadOnlyList<string> Symbols { get; set; } = [];
        public IReadOnlyList<string> Tags { get; set; } = [];
        public decimal? InitialCapital { get; set; }
        public bool PlatformExists { get; set; } = true;

        public PlatformDataModel? InsertedPlatform { get; private set; }
        public string? InsertedSymbol { get; private set; }

        public Task<IReadOnlyList<PlatformDataModel>> GetPlatformsAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(Platforms);

        public Task<IReadOnlyList<AccountDataModel>> GetAccountsAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(Accounts);

        public Task<IReadOnlyList<string>> GetSymbolsAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(Symbols);

        public Task<IReadOnlyList<string>> GetTagsAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(Tags);

        public Task<decimal?> GetInitialCapitalAsync(long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(InitialCapital);

        public Task<int> UpdateInitialCapitalAsync(long userId, decimal value, CancellationToken cancellationToken = default)
            => Task.FromResult(1);

        public Task<bool> PlatformExistsAsync(string id, long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(PlatformExists);

        public Task<bool> AccountExistsAsync(string id, long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task InsertPlatformAsync(PlatformDataModel platform, CancellationToken cancellationToken = default)
        {
            InsertedPlatform = platform;
            return Task.CompletedTask;
        }

        public Task<int> DeletePlatformAsync(string id, long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(1);

        public Task<int> UpdatePlatformNameAsync(string id, long userId, string name, CancellationToken cancellationToken = default)
            => Task.FromResult(1);

        public Task<int> UpdateAccountNameAsync(string id, long userId, string name, CancellationToken cancellationToken = default)
            => Task.FromResult(1);

        public Task InsertAccountAsync(AccountDataModel account, CancellationToken cancellationToken = default)
            => Task.CompletedTask;

        public Task<int> DeleteAccountAsync(string id, long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(1);

        public Task<bool> InsertSymbolAsync(long userId, string ticker, CancellationToken cancellationToken = default)
        {
            InsertedSymbol = ticker;
            return Task.FromResult(true);
        }

        public Task<int> DeleteSymbolAsync(long userId, string ticker, CancellationToken cancellationToken = default)
            => Task.FromResult(1);

        public Task<bool> InsertTagAsync(long userId, string name, CancellationToken cancellationToken = default)
            => Task.FromResult(true);

        public Task<int> DeleteTagAsync(long userId, string name, CancellationToken cancellationToken = default)
            => Task.FromResult(1);
    }
}
