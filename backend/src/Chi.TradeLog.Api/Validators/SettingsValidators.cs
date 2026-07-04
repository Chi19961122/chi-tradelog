using Chi.TradeLog.Api.Models.Parameters;
using FluentValidation;

namespace Chi.TradeLog.Api.Validators;

/// <summary>
/// <see cref="CreatePlatformParameter"/> 的驗證規則。
/// </summary>
public class CreatePlatformParameterValidator : AbstractValidator<CreatePlatformParameter>
{
    /// <summary>
    /// 建立驗證器。
    /// </summary>
    public CreatePlatformParameterValidator()
    {
        RuleFor(parameter => parameter.Name)
            .NotEmpty().WithMessage("平台名稱為必填。");
    }
}

/// <summary>
/// <see cref="CreateAccountParameter"/> 的驗證規則。
/// </summary>
public class CreateAccountParameterValidator : AbstractValidator<CreateAccountParameter>
{
    /// <summary>
    /// 建立驗證器。
    /// </summary>
    public CreateAccountParameterValidator()
    {
        RuleFor(parameter => parameter.Name)
            .NotEmpty().WithMessage("帳戶名稱為必填。");
    }
}

/// <summary>
/// <see cref="AddSymbolParameter"/> 的驗證規則。
/// </summary>
public class AddSymbolParameterValidator : AbstractValidator<AddSymbolParameter>
{
    /// <summary>
    /// 建立驗證器。
    /// </summary>
    public AddSymbolParameterValidator()
    {
        RuleFor(parameter => parameter.Symbol)
            .NotEmpty().WithMessage("商品代號為必填。");
    }
}

/// <summary>
/// <see cref="AddTagParameter"/> 的驗證規則。
/// </summary>
public class AddTagParameterValidator : AbstractValidator<AddTagParameter>
{
    /// <summary>
    /// 建立驗證器。
    /// </summary>
    public AddTagParameterValidator()
    {
        RuleFor(parameter => parameter.Tag)
            .NotEmpty().WithMessage("標籤名稱為必填。");
    }
}

/// <summary>
/// <see cref="UpdateCapitalParameter"/> 的驗證規則。
/// </summary>
public class UpdateCapitalParameterValidator : AbstractValidator<UpdateCapitalParameter>
{
    /// <summary>
    /// 建立驗證器。
    /// </summary>
    public UpdateCapitalParameterValidator()
    {
        RuleFor(parameter => parameter.InitialCapital)
            .GreaterThanOrEqualTo(0).WithMessage("初始資金不可為負。");
    }
}
