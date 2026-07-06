using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Repositories.Settings;

namespace Chi.TradeLog.Tests.TestDoubles;

/// <summary>
/// 共用的 <see cref="ISettingsRepository"/> 測試替身：
/// 可設定帳戶／平台是否存在，並記錄植入的商品與標籤。
/// </summary>
public class StubSettingsRepository : ISettingsRepository
{
    /// <summary>
    /// AccountExistsAsync 的回傳值（預設 true）。
    /// </summary>
    public bool AccountExists { get; set; } = true;

    /// <summary>
    /// PlatformExistsAsync 的回傳值（預設 true）。
    /// </summary>
    public bool PlatformExists { get; set; } = true;

    /// <summary>
    /// 曾植入的商品代號（依呼叫順序）。
    /// </summary>
    public List<string> InsertedSymbols { get; } = [];

    /// <summary>
    /// 曾植入的標籤（依呼叫順序）。
    /// </summary>
    public List<string> InsertedTags { get; } = [];

    /// <summary>
    /// 回傳空平台清單。
    /// </summary>
    public Task<IReadOnlyList<PlatformDataModel>> GetPlatformsAsync(long userId, CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<PlatformDataModel>>([]);

    /// <summary>
    /// 回傳空帳戶清單。
    /// </summary>
    public Task<IReadOnlyList<AccountDataModel>> GetAccountsAsync(long userId, CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<AccountDataModel>>([]);

    /// <summary>
    /// 回傳空商品清單。
    /// </summary>
    public Task<IReadOnlyList<string>> GetSymbolsAsync(long userId, CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<string>>([]);

    /// <summary>
    /// 回傳空標籤清單。
    /// </summary>
    public Task<IReadOnlyList<string>> GetTagsAsync(long userId, CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<string>>([]);

    /// <summary>
    /// 回傳無初始資金（讓 Service 走預設值）。
    /// </summary>
    public Task<decimal?> GetInitialCapitalAsync(long userId, CancellationToken cancellationToken = default)
        => Task.FromResult<decimal?>(null);

    /// <summary>
    /// 視為成功更新。
    /// </summary>
    public Task<int> UpdateInitialCapitalAsync(long userId, decimal value, CancellationToken cancellationToken = default)
        => Task.FromResult(1);

    /// <summary>
    /// 依 <see cref="PlatformExists"/> 回傳。
    /// </summary>
    public Task<bool> PlatformExistsAsync(string id, long userId, CancellationToken cancellationToken = default)
        => Task.FromResult(PlatformExists);

    /// <summary>
    /// 依 <see cref="AccountExists"/> 回傳。
    /// </summary>
    public Task<bool> AccountExistsAsync(string id, long userId, CancellationToken cancellationToken = default)
        => Task.FromResult(AccountExists);

    /// <summary>
    /// 不做事。
    /// </summary>
    public Task InsertPlatformAsync(PlatformDataModel platform, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    /// <summary>
    /// 視為成功刪除。
    /// </summary>
    public Task<int> DeletePlatformAsync(string id, long userId, CancellationToken cancellationToken = default)
        => Task.FromResult(1);

    /// <summary>
    /// 視為成功改名。
    /// </summary>
    public Task<int> UpdatePlatformNameAsync(string id, long userId, string name, CancellationToken cancellationToken = default)
        => Task.FromResult(1);

    /// <summary>
    /// 視為成功改名。
    /// </summary>
    public Task<int> UpdateAccountNameAsync(string id, long userId, string name, CancellationToken cancellationToken = default)
        => Task.FromResult(1);

    /// <summary>
    /// 不做事。
    /// </summary>
    public Task InsertAccountAsync(AccountDataModel account, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    /// <summary>
    /// 視為成功刪除。
    /// </summary>
    public Task<int> DeleteAccountAsync(string id, long userId, CancellationToken cancellationToken = default)
        => Task.FromResult(1);

    /// <summary>
    /// 記錄植入的商品代號。
    /// </summary>
    public Task<bool> InsertSymbolAsync(long userId, string ticker, CancellationToken cancellationToken = default)
    {
        InsertedSymbols.Add(ticker);
        return Task.FromResult(true);
    }

    /// <summary>
    /// 視為成功刪除。
    /// </summary>
    public Task<int> DeleteSymbolAsync(long userId, string ticker, CancellationToken cancellationToken = default)
        => Task.FromResult(1);

    /// <summary>
    /// 記錄植入的標籤。
    /// </summary>
    public Task<bool> InsertTagAsync(long userId, string name, CancellationToken cancellationToken = default)
    {
        InsertedTags.Add(name);
        return Task.FromResult(true);
    }

    /// <summary>
    /// 視為成功刪除。
    /// </summary>
    public Task<int> DeleteTagAsync(long userId, string name, CancellationToken cancellationToken = default)
        => Task.FromResult(1);
}
