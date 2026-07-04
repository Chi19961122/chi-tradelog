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
    public ApiMappingProfile()
    {
        CreateMap<TradeQueryParameter, TradeQueryInfo>();

        CreateMap<TradeDto, TradeViewModel>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id.ToString()))
            .ForMember(dest => dest.Sym, opt => opt.MapFrom(src => src.Symbol))
            .ForMember(dest => dest.R, opt => opt.MapFrom(src => src.RMultiple))
            .ForMember(dest => dest.Entry, opt => opt.MapFrom(src => src.EntryPrice))
            .ForMember(dest => dest.Exit, opt => opt.MapFrom(src => src.ExitPrice))
            .ForMember(dest => dest.Qty, opt => opt.MapFrom(src => src.Quantity))
            .ForMember(dest => dest.Day, opt => opt.MapFrom(src => src.TradedOn.Day));
    }
}
