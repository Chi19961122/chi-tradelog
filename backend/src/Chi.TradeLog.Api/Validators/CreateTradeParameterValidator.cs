using Chi.TradeLog.Api.Models.Parameters;
using FluentValidation;

namespace Chi.TradeLog.Api.Validators;

/// <summary>
/// <see cref="CreateTradeParameter"/> 的驗證規則。
/// </summary>
public class CreateTradeParameterValidator : AbstractValidator<CreateTradeParameter>
{
    /// <summary>
    /// 建立驗證器。
    /// </summary>
    public CreateTradeParameterValidator()
    {
        RuleFor(parameter => parameter.AccountId)
            .NotEmpty().WithMessage("帳戶 ID 為必填。");

        RuleFor(parameter => parameter.Sym)
            .NotEmpty().WithMessage("商品代號為必填。");

        RuleFor(parameter => parameter.Side)
            .Must(side => side is "Long" or "Short").WithMessage("方向只能是 Long 或 Short。");

        RuleFor(parameter => parameter.Entry)
            .GreaterThan(0).WithMessage("進場價須大於 0。");

        RuleFor(parameter => parameter.Exit)
            .GreaterThan(0).WithMessage("出場價須大於 0。");

        RuleFor(parameter => parameter.Qty)
            .GreaterThan(0).WithMessage("數量須大於 0。");

        RuleFor(parameter => parameter.Date)
            .Must(date => date != default).WithMessage("交易日期為必填。");

        RuleFor(parameter => parameter.StopLoss)
            .GreaterThan(0).When(parameter => parameter.StopLoss.HasValue)
            .WithMessage("停損價須大於 0。");
    }
}
