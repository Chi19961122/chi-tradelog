namespace Chi.TradeLog.Common.Models;

/// <summary>
/// 錯誤檢討項目（共用模型）。
/// </summary>
public class Mistake
{
    /// <summary>
    /// 項目文字。
    /// </summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// 是否已勾選。
    /// </summary>
    public bool Checked { get; set; }
}
