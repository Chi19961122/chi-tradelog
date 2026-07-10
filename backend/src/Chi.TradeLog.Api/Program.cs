using System.Reflection;
using System.Text;
using Chi.TradeLog.Api.Mapping;
using Chi.TradeLog.Api.Middleware;
using Chi.TradeLog.Api.Validators;
using Chi.TradeLog.Common.Options;
using Chi.TradeLog.Repositories.DependencyInjection;
using Chi.TradeLog.Services.DependencyInjection;
using Chi.TradeLog.Services.Mapping;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

const string FrontendCorsPolicy = "frontend";

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Chi.TradeLog API", Version = "v1" });
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

// 允許前端跨來源存取。來源可由設定 Cors:AllowedOrigins 覆寫，預設涵蓋 Vite dev 與容器 nginx。
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173", "http://localhost:8080"];
builder.Services.AddCors(options => options.AddPolicy(FrontendCorsPolicy, policy => policy
    .WithOrigins(allowedOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()));

// AutoMapper：掃描 Api 與 Services 兩個 assembly 的 Profile。
builder.Services.AddAutoMapper(
    _ => { },
    typeof(ApiMappingProfile).Assembly,
    typeof(ServiceMappingProfile).Assembly);

// FluentValidation：註冊 Api assembly 內所有 Validator。
builder.Services.AddValidatorsFromAssemblyContaining<TradeQueryParameterValidator>();

// JWT 認證。
var jwtSection = builder.Configuration.GetSection(JwtOptions.SectionName);
builder.Services.Configure<JwtOptions>(jwtSection);
var jwtOptions = jwtSection.Get<JwtOptions>() ?? new JwtOptions();
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // 保留 JWT 原始 claim 名稱（email/name/sub），不做 inbound 對應。
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
        };
    });
builder.Services.AddAuthorization(options =>
    options.AddPolicy("Admin", policy => policy.RequireClaim("admin", "true")));

// 應用層與資料層。
builder.Services.AddApplicationServices();

var connectionString = builder.Configuration
    .GetSection(DatabaseOptions.SectionName)[nameof(DatabaseOptions.ConnectionString)] ?? string.Empty;
builder.Services.AddDatabaseInfrastructure(connectionString);

var app = builder.Build();

// 正式環境仍使用開發用簽章金鑰時直接拒絕啟動（fail-fast）：
// 該金鑰已公開於版控歷史，繼續啟動等於任何人都能偽造 JWT（含 admin claim）。
// 金鑰須以環境變數 Jwt__Key 或 compose 的 JWT_KEY 覆寫（至少 32 bytes 隨機字串）。
if (app.Environment.IsProduction() && jwtOptions.Key.StartsWith("dev-only", StringComparison.Ordinal))
{
    throw new InvalidOperationException(
        "Jwt:Key 仍為開發用預設金鑰。正式環境請以環境變數 Jwt__Key（或 compose 的 JWT_KEY）" +
        "設定至少 32 bytes 的隨機字串後再啟動。");
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(FrontendCorsPolicy);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// 於啟動時套用 migration（整合測試環境略過，避免依賴真實資料庫）。
if (app.Environment.IsEnvironment("Testing") is false)
{
    app.Services.RunDatabaseMigrations();
}

app.Run();

/// <summary>
/// 供整合測試（WebApplicationFactory）參考的進入點型別。
/// </summary>
public partial class Program;
