using Chi.TradeLog.Api.Models.Parameters;
using FluentValidation;

namespace Chi.TradeLog.Api.Validators;

/// <summary>
/// <see cref="ImportTradeRow"/> 的驗證規則。
/// </summary>
public class ImportTradeRowValidator : AbstractValidator<ImportTradeRow>
{
    /// <summary>
    /// 建立驗證器。
    /// </summary>
    public ImportTradeRowValidator()
    {
        RuleFor(row => row.Sym).NotEmpty().WithMessage("商品代號為必填。");
        RuleFor(row => row.Side).Must(side => side is "Long" or "Short").WithMessage("方向只能是 Long 或 Short。");
        RuleFor(row => row.Entry).GreaterThan(0).WithMessage("進場價須大於 0。");
        RuleFor(row => row.Exit).GreaterThan(0).WithMessage("出場價須大於 0。");
        RuleFor(row => row.Qty).GreaterThan(0).WithMessage("數量須大於 0。");
        RuleFor(row => row.Day).InclusiveBetween(1, 31).WithMessage("日期須介於 1 到 31。");
    }
}

/// <summary>
/// <see cref="ImportTradesParameter"/> 的驗證規則。
/// </summary>
public class ImportTradesParameterValidator : AbstractValidator<ImportTradesParameter>
{
    /// <summary>
    /// 建立驗證器。
    /// </summary>
    public ImportTradesParameterValidator()
    {
        RuleFor(parameter => parameter.AccountId).NotEmpty().WithMessage("帳戶 ID 為必填。");
        RuleFor(parameter => parameter.Trades).NotEmpty().WithMessage("至少需匯入一筆交易。");
        RuleForEach(parameter => parameter.Trades).SetValidator(new ImportTradeRowValidator());
    }
}
