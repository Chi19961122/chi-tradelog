using Chi.TradeLog.Common.Models.Dtos;
using Chi.TradeLog.Common.Models.InfoModels;

namespace Chi.TradeLog.Services.Settings;

/// <summary>
/// 設定業務邏輯層（Service）。所有操作皆以使用者為範圍（多租戶隔離）。
/// </summary>
public interface ISettingsService
{
    /// <summary>
    /// 取得指定使用者的彙總設定（初始資金、平台/帳戶、商品、標籤）。
    /// </summary>
    Task<SettingsDto> GetSettingsAsync(long userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新指定使用者的初始資金。
    /// </summary>
    Task UpdateInitialCapitalAsync(long userId, decimal initialCapital, CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得指定使用者的紀律規則 JSON；未設定時回傳 <c>null</c>。
    /// </summary>
    Task<string?> GetDisciplineRulesAsync(long userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 儲存指定使用者的紀律規則 JSON。
    /// </summary>
    Task SaveDisciplineRulesAsync(long userId, string rulesJson, CancellationToken cancellationToken = default);

    /// <summary>
    /// 為指定使用者新增平台，回傳建立後的平台（含空帳戶清單）。
    /// </summary>
    Task<PlatformDto> CreatePlatformAsync(long userId, CreatePlatformInfo info, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除指定使用者的平台；成功回傳 <c>true</c>。
    /// </summary>
    Task<bool> DeletePlatformAsync(long userId, string id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 在指定使用者的平台下新增帳戶；平台不存在時回傳 <c>null</c>。
    /// </summary>
    Task<AccountDto?> CreateAccountAsync(long userId, CreateAccountInfo info, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新指定使用者的平台名稱；成功回傳 <c>true</c>。
    /// </summary>
    Task<bool> RenamePlatformAsync(long userId, string id, string name, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新指定使用者的帳戶名稱；成功回傳 <c>true</c>。
    /// </summary>
    Task<bool> RenameAccountAsync(long userId, string id, string name, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除指定使用者的帳戶；成功回傳 <c>true</c>。
    /// </summary>
    Task<bool> DeleteAccountAsync(long userId, string id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 為指定使用者新增商品代號（正規化為大寫）；成功回傳 <c>true</c>。
    /// </summary>
    Task<bool> AddSymbolAsync(long userId, string symbol, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除指定使用者的商品代號；成功回傳 <c>true</c>。
    /// </summary>
    Task<bool> RemoveSymbolAsync(long userId, string symbol, CancellationToken cancellationToken = default);

    /// <summary>
    /// 為指定使用者新增標籤；成功回傳 <c>true</c>。
    /// </summary>
    Task<bool> AddTagAsync(long userId, string tag, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除指定使用者的標籤；成功回傳 <c>true</c>。
    /// </summary>
    Task<bool> RemoveTagAsync(long userId, string tag, CancellationToken cancellationToken = default);
}
