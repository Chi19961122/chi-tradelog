using Chi.TradeLog.Api.Models.Parameters;
using FluentValidation;

namespace Chi.TradeLog.Api.Validators;

/// <summary>
/// <see cref="TradeQueryParameter"/> 的驗證規則。
/// </summary>
public class TradeQueryParameterValidator : AbstractValidator<TradeQueryParameter>
{
    public TradeQueryParameterValidator()
    {
        RuleFor(parameter => parameter.AccountIds)
            .NotEmpty().WithMessage("至少需指定一個帳戶 ID。");

        RuleForEach(parameter => parameter.AccountIds)
            .NotEmpty().WithMessage("帳戶 ID 不可為空白。");
    }
}
