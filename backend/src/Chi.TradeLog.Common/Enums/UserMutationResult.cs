namespace Chi.TradeLog.Common.Enums;

/// <summary>
/// 使用者更新／刪除的結果，供 Controller 對應 HTTP 狀態碼。
/// </summary>
public enum UserMutationResult
{
    /// <summary>
    /// 操作成功。
    /// </summary>
    Ok,

    /// <summary>
    /// 找不到使用者。
    /// </summary>
    NotFound,

    /// <summary>
    /// 電子郵件已被其他使用者使用。
    /// </summary>
    EmailConflict,

    /// <summary>
    /// 遭拒：系統至少需保留一位管理員。
    /// </summary>
    LastAdminBlocked,
}
