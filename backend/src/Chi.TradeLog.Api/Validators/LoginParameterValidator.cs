using Chi.TradeLog.Api.Models.Parameters;
using FluentValidation;

namespace Chi.TradeLog.Api.Validators;

/// <summary>
/// <see cref="LoginParameter"/> 的驗證規則。
/// </summary>
public class LoginParameterValidator : AbstractValidator<LoginParameter>
{
    /// <summary>
    /// 建立驗證器。
    /// </summary>
    public LoginParameterValidator()
    {
        RuleFor(parameter => parameter.Email)
            .NotEmpty().WithMessage("電子郵件為必填。")
            .EmailAddress().WithMessage("電子郵件格式不正確。");

        RuleFor(parameter => parameter.Password)
            .NotEmpty().WithMessage("密碼為必填。");
    }
}
