using Chi.TradeLog.Common.Models.DataModels;

namespace Chi.TradeLog.Repositories.Settings;

/// <summary>
/// 設定資料存取層（Repository）。所有操作皆以使用者為範圍（多租戶隔離）。
/// </summary>
public interface ISettingsRepository
{
    /// <summary>
    /// 取得指定使用者的所有平台。
    /// </summary>
    Task<IReadOnlyList<PlatformDataModel>> GetPlatformsAsync(long userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得指定使用者的所有帳戶。
    /// </summary>
    Task<IReadOnlyList<AccountDataModel>> GetAccountsAsync(long userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得指定使用者的所有商品代號。
    /// </summary>
    Task<IReadOnlyList<string>> GetSymbolsAsync(long userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得指定使用者的所有標籤。
    /// </summary>
    Task<IReadOnlyList<string>> GetTagsAsync(long userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得指定使用者的初始資金；尚無資料時回傳 <c>null</c>。
    /// </summary>
    Task<decimal?> GetInitialCapitalAsync(long userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新指定使用者的初始資金（不存在時新增該列），回傳受影響列數。
    /// </summary>
    Task<int> UpdateInitialCapitalAsync(long userId, decimal value, CancellationToken cancellationToken = default);

    /// <summary>
    /// 取得指定使用者的日記範本；未設定時回傳 <c>null</c>。
    /// </summary>
    Task<string?> GetJournalTemplateAsync(long userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新指定使用者的日記範本（該列不存在時建立），回傳受影響列數。
    /// </summary>
    Task<int> UpdateJournalTemplateAsync(long userId, string template, CancellationToken cancellationToken = default);

    /// <summary>
    /// 判斷指定使用者是否擁有該平台。
    /// </summary>
    Task<bool> PlatformExistsAsync(string id, long userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 判斷指定使用者是否擁有該帳戶。
    /// </summary>
    Task<bool> AccountExistsAsync(string id, long userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 新增平台（含 user_id）。
    /// </summary>
    Task InsertPlatformAsync(PlatformDataModel platform, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除指定使用者的平台（帳戶由外鍵串接刪除），回傳受影響列數。
    /// </summary>
    Task<int> DeletePlatformAsync(string id, long userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新指定使用者的平台名稱，回傳受影響列數。
    /// </summary>
    Task<int> UpdatePlatformNameAsync(string id, long userId, string name, CancellationToken cancellationToken = default);

    /// <summary>
    /// 更新指定使用者的帳戶名稱，回傳受影響列數。
    /// </summary>
    Task<int> UpdateAccountNameAsync(string id, long userId, string name, CancellationToken cancellationToken = default);

    /// <summary>
    /// 新增帳戶（含 user_id）。
    /// </summary>
    Task InsertAccountAsync(AccountDataModel account, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除指定使用者的帳戶，回傳受影響列數。
    /// </summary>
    Task<int> DeleteAccountAsync(string id, long userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// 為指定使用者新增商品代號（已存在則不重複），回傳是否新增。
    /// </summary>
    Task<bool> InsertSymbolAsync(long userId, string ticker, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除指定使用者的商品代號，回傳受影響列數。
    /// </summary>
    Task<int> DeleteSymbolAsync(long userId, string ticker, CancellationToken cancellationToken = default);

    /// <summary>
    /// 為指定使用者新增標籤（已存在則不重複），回傳是否新增。
    /// </summary>
    Task<bool> InsertTagAsync(long userId, string name, CancellationToken cancellationToken = default);

    /// <summary>
    /// 刪除指定使用者的標籤，回傳受影響列數。
    /// </summary>
    Task<int> DeleteTagAsync(long userId, string name, CancellationToken cancellationToken = default);
}
