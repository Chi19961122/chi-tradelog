# ---- build ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# 先複製專案檔以善用還原快取
COPY Chi.TradeLog.slnx ./
COPY src/Chi.TradeLog.Common/Chi.TradeLog.Common.csproj src/Chi.TradeLog.Common/
COPY src/Chi.TradeLog.Repositories/Chi.TradeLog.Repositories.csproj src/Chi.TradeLog.Repositories/
COPY src/Chi.TradeLog.Services/Chi.TradeLog.Services.csproj src/Chi.TradeLog.Services/
COPY src/Chi.TradeLog.Api/Chi.TradeLog.Api.csproj src/Chi.TradeLog.Api/
RUN dotnet restore src/Chi.TradeLog.Api/Chi.TradeLog.Api.csproj

COPY src/ src/
RUN dotnet publish src/Chi.TradeLog.Api/Chi.TradeLog.Api.csproj -c Release -o /app/publish --no-restore

# ---- runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish ./
EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080
ENTRYPOINT ["dotnet", "Chi.TradeLog.Api.dll"]
