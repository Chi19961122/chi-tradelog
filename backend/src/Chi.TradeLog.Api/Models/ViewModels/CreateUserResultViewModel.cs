namespace Chi.TradeLog.Api.Models.ViewModels;

/// <summary>
/// 建立使用者的結果回應模型（ViewModel）。
/// </summary>
public class CreateUserResultViewModel
{
    /// <summary>
    /// 建立的使用者。
    /// </summary>
    public UserSummaryViewModel User { get; init; } = new();

    /// <summary>
    /// 初始密碼（請轉交使用者，使用者可自行變更）。
    /// </summary>
    public string TemporaryPassword { get; init; } = string.Empty;
}
