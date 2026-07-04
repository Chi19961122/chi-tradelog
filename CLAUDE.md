# CLAUDE.md — Chi.TradeLog（總覽規範）

> 本檔是 Monorepo 根目錄的總覽規範。改哪一區，就先讀那一區的 `CLAUDE.md`：
> - 後端 → [`backend/CLAUDE.md`](backend/CLAUDE.md)
> - 前端 → [`frontend/CLAUDE.md`](frontend/CLAUDE.md)

## 專案定位
Chi.TradeLog 是一個**交易日記 / 績效分析 Web App**。使用者可跨帳戶檢視績效、記錄與編輯交易、檢視 P&L 月曆、分析報表，並針對每筆交易寫日誌（筆記／截圖）。

本專案為 **Monorepo**，包含兩個獨立部署單位：
- **`backend/`** — ASP.NET Core Web API（.NET 10 LTS），提供資料查詢與維護。
- **`frontend/`** — React + TypeScript 單頁應用（Vite），重建 `design_handoff_chi_tradelog/` 的設計稿。

`design_handoff_chi_tradelog/` 是**唯讀設計參考**（README + `Trading Journal.dc.html` 高擬真原型），**不進任何 build，不得直接出貨該 `.dc.html`**。

## 技術棧總表
| 分區 | 技術 |
| --- | --- |
| 後端框架 | ASP.NET Core、.NET 10 LTS、Controller-based Web API |
| 資料庫 | PostgreSQL、Npgsql、Dapper、FluentMigrator、AutoMapper |
| 認證 | JWT Bearer、BCrypt 密碼雜湊 |
| API 文件 | Swagger / OpenAPI |
| 後端測試 | xUnit、FluentAssertions、WebApplicationFactory |
| 前端框架 | React、TypeScript、Vite |
| 前端樣式 | CSS 變數（design tokens）+ CSS Modules |
| 前端圖表 | Recharts |
| 前端狀態 | Zustand（UI/偏好）、TanStack Query（伺服器資料） |
| 前端 i18n | react-i18next（EN / 繁體中文） |
| 部署 | Docker、Docker Compose（postgres + backend + frontend） |

## 目錄結構
```
Chi.TradeLog/
├─ CLAUDE.md                     # ← 本檔（總覽）
├─ docker-compose.yml            # postgres + backend + frontend
├─ design_handoff_chi_tradelog/  # 唯讀設計稿，不進 build
├─ database/                     # 資料相關文件：DATABASE_SCHEMA.md、ERD、seed/CSV 規格
├─ backend/                      # ASP.NET Core Web API（見 backend/CLAUDE.md）
└─ frontend/                     # Vite React SPA（見 frontend/CLAUDE.md）
```

## 語言規範
- **回應語言**：繁體中文。
- **程式碼註解**：繁體中文（後端用 XML 文件註解）。
- **變數／方法命名**：英文（C#：PascalCase / camelCase；TS：camelCase / PascalCase 元件）。
- **英文技術詞彙**：保留原文並附中文說明，例：Dependency Injection（依賴注入）、Repository（資料存取層）。

## Agent 通用行為準則
1. **沿用既有模式**：新增程式碼要符合該區既有的分層、命名與風格，不要引入不一致的技術（例如後端不要突然引入 EF 或 Newtonsoft.Json）。
2. **避免無關重構**：不為了「看起來乾淨」改動與當前任務無關的程式碼。
3. **動資料庫前先讀規範**：任何 SQL / 欄位 / schema 變更，先讀 [`database/DATABASE_SCHEMA.md`](database/DATABASE_SCHEMA.md)，不得自行猜表名／欄位名。
4. **動 UI 前先對照設計稿**：顏色、間距、字型一律對照 `design_handoff_chi_tradelog/README.md` 的 design tokens 與 `frontend/src/styles/tokens.css`，不憑印象調色。
5. **規範衝突優先序**：該區 `CLAUDE.md` > 該區既有程式碼風格 > 通用語言慣例。
