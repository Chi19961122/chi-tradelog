using Chi.TradeLog.Api.Models.Parameters;
using FluentValidation;

namespace Chi.TradeLog.Api.Validators;

/// <summary>
/// <see cref="CreateUserParameter"/> 的驗證規則。
/// </summary>
public class CreateUserParameterValidator : AbstractValidator<CreateUserParameter>
{
    /// <summary>
    /// 建立驗證器。
    /// </summary>
    public CreateUserParameterValidator()
    {
        RuleFor(parameter => parameter.Email)
            .NotEmpty().WithMessage("電子郵件為必填。")
            .EmailAddress().WithMessage("電子郵件格式不正確。");
        RuleFor(parameter => parameter.Name)
            .NotEmpty().WithMessage("名稱為必填。");
        RuleFor(parameter => parameter.Password!)
            .MinimumLength(8).WithMessage("密碼至少 8 碼。")
            .When(parameter => string.IsNullOrEmpty(parameter.Password) is false);
    }
}

/// <summary>
/// <see cref="UpdateUserParameter"/> 的驗證規則。
/// </summary>
public class UpdateUserParameterValidator : AbstractValidator<UpdateUserParameter>
{
    /// <summary>
    /// 建立驗證器。
    /// </summary>
    public UpdateUserParameterValidator()
    {
        RuleFor(parameter => parameter.Email)
            .NotEmpty().WithMessage("電子郵件為必填。")
            .EmailAddress().WithMessage("電子郵件格式不正確。");
        RuleFor(parameter => parameter.Name)
            .NotEmpty().WithMessage("名稱為必填。");
    }
}

/// <summary>
/// <see cref="RenameParameter"/> 的驗證規則。
/// </summary>
public class RenameParameterValidator : AbstractValidator<RenameParameter>
{
    /// <summary>
    /// 建立驗證器。
    /// </summary>
    public RenameParameterValidator()
    {
        RuleFor(parameter => parameter.Name)
            .NotEmpty().WithMessage("名稱為必填。")
            .MaximumLength(128).WithMessage("名稱長度過長。");
    }
}

/// <summary>
/// <see cref="ChangePasswordParameter"/> 的驗證規則。
/// </summary>
public class ChangePasswordParameterValidator : AbstractValidator<ChangePasswordParameter>
{
    /// <summary>
    /// 建立驗證器。
    /// </summary>
    public ChangePasswordParameterValidator()
    {
        RuleFor(parameter => parameter.CurrentPassword)
            .NotEmpty().WithMessage("目前密碼為必填。");
        RuleFor(parameter => parameter.NewPassword)
            .NotEmpty().WithMessage("新密碼為必填。")
            .MinimumLength(8).WithMessage("新密碼至少 8 碼。");
    }
}
