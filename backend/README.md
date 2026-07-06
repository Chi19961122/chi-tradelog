# Chi.TradeLog Backend

ASP.NET Core（.NET 10）Web API。分層架構：`Api`（Controllers）→ `Services`（業務邏輯）→ `Repositories`（Dapper + PostgreSQL）→ `Common`（共用模型）。

## 建置與測試

```bash
dotnet build
dotnet test        # xUnit + FluentAssertions（service 單元 + WebApplicationFactory 整合）
```

## 執行

```bash
# 需要本機 PostgreSQL（連線字串見 appsettings.json 的 Database:ConnectionString）
dotnet run --project src/Chi.TradeLog.Api
# 開發模式 Swagger：http://localhost:5079/swagger
```

schema 由 FluentMigrator 於啟動時自動套用（`Chi.TradeLog.Repositories/Migrations`），不可手動改資料庫；欄位定義見 [`../database/DATABASE_SCHEMA.md`](../database/DATABASE_SCHEMA.md)。

## 設定覆寫

ASP.NET Core 原生支援以環境變數覆寫 appsettings（`__` 分隔區段）：

| 環境變數 | 用途 |
| --- | --- |
| `Database__ConnectionString` | PostgreSQL 連線字串 |
| `Jwt__Key` | JWT 簽章金鑰（正式環境必改，至少 32 bytes） |
| `Cors__AllowedOrigins__0…` | 允許的前端來源 |

開發規範（分層、命名、註解慣例）見 [`CLAUDE.md`](CLAUDE.md)。
