using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Common.Models.Dtos;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Repositories.Settings;

namespace Chi.TradeLog.Services.Settings;

/// <summary>
/// 設定 Service 實作。組出彙總設定，並處理平台/帳戶/商品/標籤的維護與 id 產生。
/// </summary>
public class SettingsService : ISettingsService
{
    private readonly ISettingsRepository _repository;

    /// <summary>
    /// 建立設定 Service。
    /// </summary>
    public SettingsService(ISettingsRepository repository)
    {
        _repository = repository;
    }

    /// <summary>
    /// 取得彙總設定：把帳戶依平台分組，並帶入商品、標籤與初始資金。
    /// </summary>
    public async Task<SettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default)
    {
        var platforms = await _repository.GetPlatformsAsync(cancellationToken);
        var accounts = await _repository.GetAccountsAsync(cancellationToken);
        var symbols = await _repository.GetSymbolsAsync(cancellationToken);
        var tags = await _repository.GetTagsAsync(cancellationToken);
        var initialCapital = await _repository.GetInitialCapitalAsync(cancellationToken);

        var accountsByPlatform = accounts
            .GroupBy(account => account.PlatformId)
            .ToDictionary(group => group.Key, group => group.ToList());

        var platformDtos = platforms.Select(platform => new PlatformDto
        {
            Id = platform.Id,
            Name = platform.Name,
            Accounts = accountsByPlatform.TryGetValue(platform.Id, out var list)
                ? list.Select(ToAccountDto).ToList()
                : [],
        }).ToList();

        return new SettingsDto
        {
            InitialCapital = initialCapital,
            Platforms = platformDtos,
            Symbols = symbols,
            Tags = tags,
        };
    }

    /// <summary>
    /// 更新初始資金。
    /// </summary>
    public async Task UpdateInitialCapitalAsync(decimal initialCapital, CancellationToken cancellationToken = default)
    {
        await _repository.UpdateInitialCapitalAsync(initialCapital, cancellationToken);
    }

    /// <summary>
    /// 新增平台：產生新 id 並寫入，回傳含空帳戶清單的平台。
    /// </summary>
    public async Task<PlatformDto> CreatePlatformAsync(CreatePlatformInfo info, CancellationToken cancellationToken = default)
    {
        var platform = new PlatformDataModel { Id = NewId("p"), Name = info.Name.Trim() };
        await _repository.InsertPlatformAsync(platform, cancellationToken);
        return new PlatformDto { Id = platform.Id, Name = platform.Name, Accounts = [] };
    }

    /// <summary>
    /// 刪除平台；成功回傳 <c>true</c>。
    /// </summary>
    public async Task<bool> DeletePlatformAsync(string id, CancellationToken cancellationToken = default)
    {
        var affected = await _repository.DeletePlatformAsync(id, cancellationToken);
        return affected > 0;
    }

    /// <summary>
    /// 在指定平台下新增帳戶：平台存在才寫入，否則回傳 <c>null</c>。
    /// </summary>
    public async Task<AccountDto?> CreateAccountAsync(CreateAccountInfo info, CancellationToken cancellationToken = default)
    {
        var exists = await _repository.PlatformExistsAsync(info.PlatformId, cancellationToken);
        if (exists is false)
        {
            return null;
        }

        var account = new AccountDataModel { Id = NewId("a"), PlatformId = info.PlatformId, Name = info.Name.Trim() };
        await _repository.InsertAccountAsync(account, cancellationToken);
        return new AccountDto { Id = account.Id, Name = account.Name };
    }

    /// <summary>
    /// 刪除帳戶；成功回傳 <c>true</c>。
    /// </summary>
    public async Task<bool> DeleteAccountAsync(string id, CancellationToken cancellationToken = default)
    {
        var affected = await _repository.DeleteAccountAsync(id, cancellationToken);
        return affected > 0;
    }

    /// <summary>
    /// 新增商品代號（正規化為大寫並去空白）；成功回傳 <c>true</c>。
    /// </summary>
    public async Task<bool> AddSymbolAsync(string symbol, CancellationToken cancellationToken = default)
    {
        var normalized = symbol.Trim().ToUpperInvariant();
        if (normalized.Length == 0)
        {
            return false;
        }
        return await _repository.InsertSymbolAsync(normalized, cancellationToken);
    }

    /// <summary>
    /// 刪除商品代號；成功回傳 <c>true</c>。
    /// </summary>
    public async Task<bool> RemoveSymbolAsync(string symbol, CancellationToken cancellationToken = default)
    {
        var affected = await _repository.DeleteSymbolAsync(symbol.Trim().ToUpperInvariant(), cancellationToken);
        return affected > 0;
    }

    /// <summary>
    /// 新增標籤（去空白）；成功回傳 <c>true</c>。
    /// </summary>
    public async Task<bool> AddTagAsync(string tag, CancellationToken cancellationToken = default)
    {
        var normalized = tag.Trim();
        if (normalized.Length == 0)
        {
            return false;
        }
        return await _repository.InsertTagAsync(normalized, cancellationToken);
    }

    /// <summary>
    /// 刪除標籤；成功回傳 <c>true</c>。
    /// </summary>
    public async Task<bool> RemoveTagAsync(string tag, CancellationToken cancellationToken = default)
    {
        var affected = await _repository.DeleteTagAsync(tag.Trim(), cancellationToken);
        return affected > 0;
    }

    /// <summary>
    /// 由 DataModel 轉為帳戶 Dto。
    /// </summary>
    private static AccountDto ToAccountDto(AccountDataModel account) =>
        new() { Id = account.Id, Name = account.Name };

    /// <summary>
    /// 產生帶前綴的新 id（例如 <c>p3f9a1b2c</c>）。
    /// </summary>
    private static string NewId(string prefix) =>
        prefix + Guid.NewGuid().ToString("N")[..8];
}
