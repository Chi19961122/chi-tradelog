using Chi.TradeLog.Common.Models.Dtos;
using Chi.TradeLog.Common.Models.InfoModels;

namespace Chi.TradeLog.Services.Settings;

/// <summary>
/// 設定業務邏輯層（Service）。
/// </summary>
public interface ISettingsService
{
    /// <summary>
    /// 取得彙總設定（初始資金、平台/帳戶、商品、標籤）。
    /// </summary>
    Task<SettingsDto> GetSettingsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新初始資金。
    /// </summary>
    Task UpdateInitialCapitalAsync(decimal initialCapital, CancellationToken cancellationToken = default);

    /// <summary>
    /// 新增平台，回傳建立後的平台（含空帳戶清單）。
    /// </summary>
    Task<PlatformDto> CreatePlatformAsync(CreatePlatformInfo info, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除平台；成功回傳 <c>true</c>。
    /// </summary>
    Task<bool> DeletePlatformAsync(string id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 在指定平台下新增帳戶；平台不存在時回傳 <c>null</c>。
    /// </summary>
    Task<AccountDto?> CreateAccountAsync(CreateAccountInfo info, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除帳戶；成功回傳 <c>true</c>。
    /// </summary>
    Task<bool> DeleteAccountAsync(string id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 新增商品代號（正規化為大寫）；成功回傳 <c>true</c>。
    /// </summary>
    Task<bool> AddSymbolAsync(string symbol, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除商品代號；成功回傳 <c>true</c>。
    /// </summary>
    Task<bool> RemoveSymbolAsync(string symbol, CancellationToken cancellationToken = default);

    /// <summary>
    /// 新增標籤；成功回傳 <c>true</c>。
    /// </summary>
    Task<bool> AddTagAsync(string tag, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除標籤；成功回傳 <c>true</c>。
    /// </summary>
    Task<bool> RemoveTagAsync(string tag, CancellationToken cancellationToken = default);
}
