using AutoMapper;
using Chi.TradeLog.Api.Models.Parameters;
using Chi.TradeLog.Api.Models.ViewModels;
using Chi.TradeLog.Common.Models.Dtos;
using Chi.TradeLog.Common.Models.InfoModels;

namespace Chi.TradeLog.Api.Mapping;

/// <summary>
/// Api 層的 AutoMapper 設定：Parameter → InfoModel、Dto → ViewModel。
/// </summary>
public class ApiMappingProfile : Profile
{
    /// <summary>
    /// 建立對應設定。
    /// </summary>
    public ApiMappingProfile()
    {
        CreateMap<TradeQueryParameter, TradeQueryInfo>();
        CreateMap<CreateTradeParameter, SaveTradeInfo>();
        CreateMap<UpdateTradeParameter, SaveTradeInfo>();
        CreateMap<ImportTradeRow, SaveTradeInfo>();

        CreateMap<TradeDto, TradeViewModel>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id.ToString()))
            .ForMember(dest => dest.Sym, opt => opt.MapFrom(src => src.Symbol))
            .ForMember(dest => dest.R, opt => opt.MapFrom(src => src.RMultiple))
            .ForMember(dest => dest.Entry, opt => opt.MapFrom(src => src.EntryPrice))
            .ForMember(dest => dest.Exit, opt => opt.MapFrom(src => src.ExitPrice))
            .ForMember(dest => dest.Qty, opt => opt.MapFrom(src => src.Quantity))
            .ForMember(dest => dest.Day, opt => opt.MapFrom(src => src.TradedOn.Day));

        // 設定：Parameter → InfoModel、Dto → ViewModel
        CreateMap<CreatePlatformParameter, CreatePlatformInfo>();
        CreateMap<AccountDto, AccountViewModel>();
        CreateMap<PlatformDto, PlatformViewModel>();
        CreateMap<SettingsDto, SettingsViewModel>();

        // 交易日記：Parameter → InfoModel、Dto → ViewModel
        CreateMap<SaveJournalParameter, SaveJournalInfo>();
        CreateMap<JournalDto, JournalViewModel>();

        // 認證：Dto → ViewModel
        CreateMap<UserDto, UserViewModel>();
        CreateMap<AuthResultDto, AuthViewModel>();

        // 使用者管理：Parameter → InfoModel、Dto → ViewModel
        CreateMap<CreateUserParameter, CreateUserInfo>();
        CreateMap<UserSummaryDto, UserSummaryViewModel>();
        CreateMap<CreateUserResultDto, CreateUserResultViewModel>();
    }
}
