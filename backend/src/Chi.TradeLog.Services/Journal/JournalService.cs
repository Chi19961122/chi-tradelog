using System.Text.Json;
using Chi.TradeLog.Common.Models;
using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Common.Models.Dtos;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Repositories.Journal;
using Chi.TradeLog.Repositories.Settings;

namespace Chi.TradeLog.Services.Journal;

/// <summary>
/// 交易日記 Service 實作。負責 <c>mistakes</c> 於 JSON 字串與物件清單間的轉換，
/// 以及每位使用者日記範本的讀寫（儲存在 app_settings）。
/// </summary>
public class JournalService : IJournalService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IJournalRepository _repository;
    private readonly ISettingsRepository _settingsRepository;

    /// <summary>
    /// 建立交易日記 Service。
    /// </summary>
    public JournalService(IJournalRepository repository, ISettingsRepository settingsRepository)
    {
        _repository = repository;
        _settingsRepository = settingsRepository;
    }

    /// <summary>
    /// 取得指定使用者的日記範本；未設定時回傳 <c>null</c>。
    /// </summary>
    public async Task<string?> GetTemplateAsync(long userId, CancellationToken cancellationToken = default)
    {
        return await _settingsRepository.GetJournalTemplateAsync(userId, cancellationToken);
    }

    /// <summary>
    /// 儲存指定使用者的日記範本。
    /// </summary>
    public async Task SaveTemplateAsync(long userId, string template, CancellationToken cancellationToken = default)
    {
        await _settingsRepository.UpdateJournalTemplateAsync(userId, template, cancellationToken);
    }

    /// <summary>
    /// 依使用者/帳戶/商品/日期取得日記，並將 mistakes JSON 反序列化為清單。
    /// </summary>
    public async Task<JournalDto?> GetJournalAsync(
        long userId, string accountId, string symbol, DateOnly date, CancellationToken cancellationToken = default)
    {
        var data = await _repository.GetAsync(userId, accountId, symbol, date, cancellationToken);
        if (data is null)
        {
            return null;
        }

        return new JournalDto
        {
            AccountId = data.AccountId,
            Symbol = data.Symbol,
            Date = data.EntryDate,
            Notes = data.Notes,
            Emotions = data.Emotions,
            Mistakes = DeserializeMistakes(data.Mistakes),
        };
    }

    /// <summary>
    /// 儲存日記，並將 mistakes 清單序列化為 JSON 後 upsert。
    /// </summary>
    public async Task SaveJournalAsync(SaveJournalInfo info, CancellationToken cancellationToken = default)
    {
        var data = new JournalEntryDataModel
        {
            UserId = info.UserId,
            AccountId = info.AccountId,
            Symbol = info.Symbol,
            EntryDate = info.Date,
            Notes = info.Notes,
            Emotions = info.Emotions.ToArray(),
            Mistakes = JsonSerializer.Serialize(info.Mistakes, JsonOptions),
        };
        await _repository.UpsertAsync(data, cancellationToken);
    }

    /// <summary>
    /// 將 mistakes 的 JSON 字串反序列化為清單（失敗時回傳空清單）。
    /// </summary>
    private static IReadOnlyList<Mistake> DeserializeMistakes(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }
        return JsonSerializer.Deserialize<List<Mistake>>(json, JsonOptions) ?? [];
    }
}
