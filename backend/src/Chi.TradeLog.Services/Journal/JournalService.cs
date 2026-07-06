using System.Text.Json;
using Chi.TradeLog.Common.Models;
using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Common.Models.Dtos;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Repositories.Journal;

namespace Chi.TradeLog.Services.Journal;

/// <summary>
/// 交易日記 Service 實作。負責 <c>mistakes</c> 於 JSON 字串與物件清單間的轉換。
/// </summary>
public class JournalService : IJournalService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IJournalRepository _repository;

    /// <summary>
    /// 建立交易日記 Service。
    /// </summary>
    public JournalService(IJournalRepository repository)
    {
        _repository = repository;
    }

    /// <summary>
    /// 依使用者/帳戶/商品/日期取得日記，並將 mistakes JSON 反序列化為清單。
    /// </summary>
    public async Task<JournalDto?> GetJournalAsync(
        long userId, string accountId, string symbol, int day, CancellationToken cancellationToken = default)
    {
        var data = await _repository.GetAsync(userId, accountId, symbol, day, cancellationToken);
        if (data is null)
        {
            return null;
        }

        return new JournalDto
        {
            AccountId = data.AccountId,
            Symbol = data.Symbol,
            Day = data.Day,
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
            Day = info.Day,
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
