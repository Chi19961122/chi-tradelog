# Chi.TradeLog

交易日記／績效分析 Web App。支援多使用者（資料完全隔離），可跨帳戶檢視績效、記錄與編輯交易、檢視 P&L 月曆、分析報表，並為每筆交易撰寫日記（筆記、情緒、錯誤檢討、截圖）。

| 分區 | 技術 |
| --- | --- |
| `backend/` | ASP.NET Core（.NET 10）、PostgreSQL、Dapper、FluentMigrator、JWT + BCrypt |
| `frontend/` | React + TypeScript（Vite）、CSS Modules、Recharts、Zustand、TanStack Query、react-i18next（EN／繁中） |

## 快速開始（Docker Compose）

```bash
# 於 repo 根目錄
docker compose up -d --build
```

- 前端：<http://localhost:8080>
- 後端 API：<http://localhost:5079>（開發模式含 Swagger：`/swagger`）
- 資料庫 schema 由 FluentMigrator 於後端啟動時自動建立並植入示範資料。

**示範帳號**：`alex@chitradelog.com` / `demo1234`（管理員）

### 環境變數（正式環境必改）

複製 [`.env.example`](.env.example) 為 `.env` 並覆寫：

| 變數 | 用途 |
| --- | --- |
| `POSTGRES_PASSWORD` | PostgreSQL 密碼 |
| `JWT_KEY` | JWT 簽章金鑰（至少 32 bytes 隨機字串） |

## 本機開發

### 前端（mock 模式，不需後端）

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173，內建確定性 mock 資料
```

### 前端（API 模式，連真後端）

```bash
# 1. 啟動資料庫與後端
docker compose up -d postgres backend

# 2. 設定 API 位址（frontend/.env，參考 frontend/.env.example）
echo VITE_API_BASE_URL=http://localhost:5079 > frontend/.env

# 3. 啟動 dev server
cd frontend && npm run dev
```

### 後端

```bash
cd backend
dotnet build
dotnet test                                   # xUnit 測試
dotnet run --project src/Chi.TradeLog.Api     # 需本機 PostgreSQL（見 appsettings.json）
```

## 使用者管理

- 管理員登入後於 **Settings → Users** 建立／編輯／刪除使用者、重設密碼。
- 新使用者的初始密碼為 `changeme123`，建立後畫面會顯示提示；請轉交使用者並提醒於 **Settings → Password** 自行變更。
- 每位使用者的資料（平台/帳戶、交易、日記、設定）完全隔離；系統至少保留一位管理員。

## 測試

```bash
cd frontend && npm test      # Vitest（lib/ 純函式）
cd backend && dotnet test    # xUnit（service 單元 + endpoint 整合）
```

## 目錄結構

```
├─ backend/     # ASP.NET Core Web API（分層：Api / Services / Repositories / Common）
├─ frontend/    # Vite React SPA
├─ database/    # DATABASE_SCHEMA.md（schema 單一事實來源）
├─ docs/plans/  # 實作計畫
└─ docker-compose.yml
```

開發規範見各區 `CLAUDE.md` 與 [`frontend/DESIGN_GUIDELINES.md`](frontend/DESIGN_GUIDELINES.md)。
