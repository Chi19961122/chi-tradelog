namespace Chi.TradeLog.Api.Models.ViewModels;

/// <summary>
/// 批次匯入結果回應模型（ViewModel）。
/// </summary>
public class ImportResultViewModel
{
    /// <summary>
    /// 實際新增的交易筆數。
    /// </summary>
    public int Imported { get; init; }
}
