using Chi.TradeLog.Common.Models;
using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Repositories.Journal;
using Chi.TradeLog.Services.Journal;
using Chi.TradeLog.Tests.TestDoubles;
using FluentAssertions;
using Xunit;

namespace Chi.TradeLog.Tests.Journal;

public class JournalServiceTests
{
    [Fact]
    public async Task GetJournalAsync_ReturnsNull_WhenNotFound()
    {
        var repository = new FakeJournalRepository { Stored = null };
        var service = new JournalService(repository, new StubSettingsRepository());

        var result = await service.GetJournalAsync(1, "a1", "AAPL", new DateOnly(2026, 7, 5));

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetJournalAsync_DeserializesMistakesJson()
    {
        var repository = new FakeJournalRepository
        {
            Stored = new JournalEntryDataModel
            {
                AccountId = "a1",
                Symbol = "AAPL",
                EntryDate = new DateOnly(2026, 7, 5),
                Notes = "<b>note</b>",
                Emotions = ["Calm"],
                Mistakes = """[{"label":"Chased entry","checked":true}]""",
            },
        };
        var service = new JournalService(repository, new StubSettingsRepository());

        var result = await service.GetJournalAsync(1, "a1", "AAPL", new DateOnly(2026, 7, 5));

        result.Should().NotBeNull();
        result!.Notes.Should().Be("<b>note</b>");
        result.Emotions.Should().ContainSingle().Which.Should().Be("Calm");
        result.Mistakes.Should().ContainSingle();
        result.Mistakes[0].Label.Should().Be("Chased entry");
        result.Mistakes[0].Checked.Should().BeTrue();
    }

    [Fact]
    public async Task SaveJournalAsync_SerializesMistakesToJson()
    {
        var repository = new FakeJournalRepository();
        var service = new JournalService(repository, new StubSettingsRepository());
        var info = new SaveJournalInfo
        {
            UserId = 1,
            AccountId = "a1",
            Symbol = "AAPL",
            Date = new DateOnly(2026, 7, 5),
            Notes = "n",
            Emotions = ["Confident"],
            Mistakes = [new Mistake { Label = "Oversized position", Checked = false }],
        };

        await service.SaveJournalAsync(info);

        repository.Upserted.Should().NotBeNull();
        repository.Upserted!.Emotions.Should().ContainSingle().Which.Should().Be("Confident");
        repository.Upserted.Mistakes.Should().Contain("Oversized position");
        repository.Upserted.Mistakes.Should().Contain("checked");
        repository.Upserted.UserId.Should().Be(1); // 寫入帶入使用者範圍
    }

    [Fact]
    public async Task GetAllJournalsAsync_ReturnsSummariesWithoutNotes()
    {
        var repository = new FakeJournalRepository
        {
            AllStored =
            [
                new JournalEntryDataModel
                {
                    AccountId = "a1",
                    Symbol = "AAPL",
                    EntryDate = new DateOnly(2026, 7, 5),
                    Notes = string.Empty, // Repository 已固定回空字串
                    Emotions = ["FOMO"],
                    Mistakes = """[{"label":"Chased entry","checked":true}]""",
                },
            ],
        };
        var service = new JournalService(repository, new StubSettingsRepository());

        var result = await service.GetAllJournalsAsync(1);

        result.Should().ContainSingle();
        result[0].Symbol.Should().Be("AAPL");
        result[0].Notes.Should().BeEmpty();
        result[0].Emotions.Should().ContainSingle().Which.Should().Be("FOMO");
        result[0].Mistakes.Should().ContainSingle().Which.Checked.Should().BeTrue();
    }

    [Fact]
    public async Task Template_SaveAndGet_RoundTrips()
    {
        var settings = new StubSettingsRepository();
        var service = new JournalService(new FakeJournalRepository(), settings);

        await service.SaveTemplateAsync(1, "<p>my template</p>");
        var template = await service.GetTemplateAsync(1);

        template.Should().Be("<p>my template</p>");
    }

    private class FakeJournalRepository : IJournalRepository
    {
        public JournalEntryDataModel? Stored { get; set; }
        public JournalEntryDataModel? Upserted { get; private set; }
        public IReadOnlyList<JournalEntryDataModel> AllStored { get; set; } = [];

        public Task<JournalEntryDataModel?> GetAsync(
            long userId, string accountId, string symbol, DateOnly date, CancellationToken cancellationToken = default)
            => Task.FromResult(Stored);

        public Task UpsertAsync(JournalEntryDataModel entry, CancellationToken cancellationToken = default)
        {
            Upserted = entry;
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<JournalEntryDataModel>> GetAllByUserAsync(
            long userId, CancellationToken cancellationToken = default)
            => Task.FromResult(AllStored);
    }
}
