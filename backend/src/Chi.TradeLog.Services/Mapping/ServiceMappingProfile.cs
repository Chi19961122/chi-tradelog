using AutoMapper;
using Chi.TradeLog.Common.Models.Conditions;
using Chi.TradeLog.Common.Models.DataModels;
using Chi.TradeLog.Common.Models.Dtos;
using Chi.TradeLog.Common.Models.InfoModels;

namespace Chi.TradeLog.Services.Mapping;

/// <summary>
/// Service 層的 AutoMapper 設定：InfoModel → Condition、DataModel → Dto。
/// </summary>
public class ServiceMappingProfile : Profile
{
    public ServiceMappingProfile()
    {
        CreateMap<TradeQueryInfo, TradeQueryCondition>();
        CreateMap<TradeDataModel, TradeDto>();
    }
}
