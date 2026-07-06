using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Common.Models.Dtos;
using Chi.TradeLog.Common.Models.InfoModels;
using Chi.TradeLog.Repositories.Settings;

namespace Chi.TradeLog.Services.Settings;

/// <summary>
/// 設定 Service 實作。組出彙總設定，並處理平台/帳戶/商品/標籤的維護與 id 產生；
/// 所有操作皆以使用者為範圍（多租戶隔離）。
/// </summary>
public class SettingsService : ISettingsService
{
    // 使用者尚未設定初始資金時的預設值（與前端 uiStore 預設一致）。
    private const decimal DefaultInitialCapital = 10000m;

    private readonly ISettingsRepository _repository;

    /// <summary>
    /// 建立設定 Service。
    /// </summary>
    public SettingsService(ISettingsRepository repository)
    {
        _repository = repository;
    }

    /// <summary>
    /// 取得指定使用者的彙總設定：把帳戶依平台分組，並帶入商品、標籤與初始資金。
    /// </summary>
    public async Task<SettingsDto> GetSettingsAsync(long userId, CancellationToken cancellationToken = default)
    {
        var platforms = await _repository.GetPlatformsAsync(userId, cancellationToken);
        var accounts = await _repository.GetAccountsAsync(userId, cancellationToken);
        var symbols = await _repository.GetSymbolsAsync(userId, cancellationToken);
        var tags = await _repository.GetTagsAsync(userId, cancellationToken);
        var initialCapital = await _repository.GetInitialCapitalAsync(userId, cancellationToken);

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
            InitialCapital = initialCapital ?? DefaultInitialCapital,
            Platforms = platformDtos,
            Symbols = symbols,
            Tags = tags,
        };
    }

    /// <summary>
    /// 更新指定使用者的初始資金（尚無資料時新增該列）。
    /// </summary>
    public async Task UpdateInitialCapitalAsync(long userId, decimal initialCapital, CancellationToken cancellationToken = default)
    {
        await _repository.UpdateInitialCapitalAsync(userId, initialCapital, cancellationToken);
    }

    /// <summary>
    /// 為指定使用者新增平台：產生新 id 並寫入，回傳含空帳戶清單的平台。
    /// </summary>
    public async Task<PlatformDto> CreatePlatformAsync(long userId, CreatePlatformInfo info, CancellationToken cancellationToken = default)
    {
        var platform = new PlatformDataModel { UserId = userId, Id = NewId("p"), Name = info.Name.Trim() };
        await _repository.InsertPlatformAsync(platform, cancellationToken);
        return new PlatformDto { Id = platform.Id, Name = platform.Name, Accounts = [] };
    }

    /// <summary>
    /// 刪除指定使用者的平台；成功回傳 <c>true</c>。
    /// </summary>
    public async Task<bool> DeletePlatformAsync(long userId, string id, CancellationToken cancellationToken = default)
    {
        var affected = await _repository.DeletePlatformAsync(id, userId, cancellationToken);
        return affected > 0;
    }

    /// <summary>
    /// 在指定使用者的平台下新增帳戶：平台存在（且屬於該使用者）才寫入，否則回傳 <c>null</c>。
    /// </summary>
    public async Task<AccountDto?> CreateAccountAsync(long userId, CreateAccountInfo info, CancellationToken cancellationToken = default)
    {
        var exists = await _repository.PlatformExistsAsync(info.PlatformId, userId, cancellationToken);
        if (exists is false)
        {
            return null;
        }

        var account = new AccountDataModel { UserId = userId, Id = NewId("a"), PlatformId = info.PlatformId, Name = info.Name.Trim() };
        await _repository.InsertAccountAsync(account, cancellationToken);
        return new AccountDto { Id = account.Id, Name = account.Name };
    }

    /// <summary>
    /// 更新指定使用者的平台名稱；成功回傳 <c>true</c>。
    /// </summary>
    public async Task<bool> RenamePlatformAsync(long userId, string id, string name, CancellationToken cancellationToken = default)
    {
        var affected = await _repository.UpdatePlatformNameAsync(id, userId, name.Trim(), cancellationToken);
        return affected > 0;
    }

    /// <summary>
    /// 更新指定使用者的帳戶名稱；成功回傳 <c>true</c>。
    /// </summary>
    public async Task<bool> RenameAccountAsync(long userId, string id, string name, CancellationToken cancellationToken = default)
    {
        var affected = await _repository.UpdateAccountNameAsync(id, userId, name.Trim(), cancellationToken);
        return affected > 0;
    }

    /// <summary>
    /// 刪除指定使用者的帳戶；成功回傳 <c>true</c>。
    /// </summary>
    public async Task<bool> DeleteAccountAsync(long userId, string id, CancellationToken cancellationToken = default)
    {
        var affected = await _repository.DeleteAccountAsync(id, userId, cancellationToken);
        return affected > 0;
    }

    /// <summary>
    /// 為指定使用者新增商品代號（正規化為大寫並去空白）；成功回傳 <c>true</c>。
    /// </summary>
    public async Task<bool> AddSymbolAsync(long userId, string symbol, CancellationToken cancellationToken = default)
    {
        var normalized = symbol.Trim().ToUpperInvariant();
        if (normalized.Length == 0)
        {
            return false;
        }
        return await _repository.InsertSymbolAsync(userId, normalized, cancellationToken);
    }

    /// <summary>
    /// 刪除指定使用者的商品代號；成功回傳 <c>true</c>。
    /// </summary>
    public async Task<bool> RemoveSymbolAsync(long userId, string symbol, CancellationToken cancellationToken = default)
    {
        var affected = await _repository.DeleteSymbolAsync(userId, symbol.Trim().ToUpperInvariant(), cancellationToken);
        return affected > 0;
    }

    /// <summary>
    /// 為指定使用者新增標籤（去空白）；成功回傳 <c>true</c>。
    /// </summary>
    public async Task<bool> AddTagAsync(long userId, string tag, CancellationToken cancellationToken = default)
    {
        var normalized = tag.Trim();
        if (normalized.Length == 0)
        {
            return false;
        }
        return await _repository.InsertTagAsync(userId, normalized, cancellationToken);
    }

    /// <summary>
    /// 刪除指定使用者的標籤；成功回傳 <c>true</c>。
    /// </summary>
    public async Task<bool> RemoveTagAsync(long userId, string tag, CancellationToken cancellationToken = default)
    {
        var affected = await _repository.DeleteTagAsync(userId, tag.Trim(), cancellationToken);
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
