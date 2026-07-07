using Chi.TradeLog.Api.Models.Parameters;
using FluentValidation;

namespace Chi.TradeLog.Api.Validators;

/// <summary>
/// <see cref="SaveJournalParameter"/> 的驗證規則。
/// </summary>
public class SaveJournalParameterValidator : AbstractValidator<SaveJournalParameter>
{
    /// <summary>
    /// 建立驗證器。
    /// </summary>
    public SaveJournalParameterValidator()
    {
        RuleFor(parameter => parameter.AccountId)
            .NotEmpty().WithMessage("帳戶 id 為必填。");

        RuleFor(parameter => parameter.Symbol)
            .NotEmpty().WithMessage("商品代號為必填。");

        RuleFor(parameter => parameter.Date)
            .Must(date => date != default).WithMessage("日記日期為必填。");
    }
}
