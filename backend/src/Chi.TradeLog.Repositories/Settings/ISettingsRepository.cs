using Chi.TradeLog.Common.Models.DataModels;

namespace Chi.TradeLog.Repositories.Settings;

/// <summary>
/// 設定資料存取層（Repository）。
/// </summary>
public interface ISettingsRepository
{
    /// <summary>
    /// 取得所有平台。
    /// </summary>
    Task<IReadOnlyList<PlatformDataModel>> GetPlatformsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得所有帳戶。
    /// </summary>
    Task<IReadOnlyList<AccountDataModel>> GetAccountsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得所有商品代號。
    /// </summary>
    Task<IReadOnlyList<string>> GetSymbolsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得所有標籤。
    /// </summary>
    Task<IReadOnlyList<string>> GetTagsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得初始資金。
    /// </summary>
    Task<decimal> GetInitialCapitalAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新初始資金，回傳受影響列數。
    /// </summary>
    Task<int> UpdateInitialCapitalAsync(decimal value, CancellationToken cancellationToken = default);

    /// <summary>
    /// 判斷平台是否存在。
    /// </summary>
    Task<bool> PlatformExistsAsync(string id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 新增平台。
    /// </summary>
    Task InsertPlatformAsync(PlatformDataModel platform, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除平台（連同其帳戶，透過外鍵串接刪除），回傳受影響列數。
    /// </summary>
    Task<int> DeletePlatformAsync(string id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 新增帳戶。
    /// </summary>
    Task InsertAccountAsync(AccountDataModel account, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除帳戶，回傳受影響列數。
    /// </summary>
    Task<int> DeleteAccountAsync(string id, CancellationToken cancellationToken = default);

    /// <summary>
    /// 新增商品代號（已存在則不重複），回傳是否新增。
    /// </summary>
    Task<bool> InsertSymbolAsync(string ticker, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除商品代號，回傳受影響列數。
    /// </summary>
    Task<int> DeleteSymbolAsync(string ticker, CancellationToken cancellationToken = default);

    /// <summary>
    /// 新增標籤（已存在則不重複），回傳是否新增。
    /// </summary>
    Task<bool> InsertTagAsync(string name, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除標籤，回傳受影響列數。
    /// </summary>
    Task<int> DeleteTagAsync(string name, CancellationToken cancellationToken = default);
}
