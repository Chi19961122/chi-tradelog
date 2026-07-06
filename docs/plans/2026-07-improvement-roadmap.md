# 2026-07 系統優化路線圖

> 狀態：**已完成**（2026-07-06，Phase 1–6 全數實作並驗證）｜ 分支：`feature/系統優化調整`

## Context
專案六大畫面 + Journal + Auth + CSV + 使用者管理皆已完成可用。目標是把它推向**真正多人上線**，並收斂四軌改善：B（去假資料）/ C（前端打磨）/ D（功能補齊）/ E（交付DX）。三路盤點（前端 / 後端 / 交付）結論：**無阻斷性 bug**，但因為要多使用者，**Track A（per-user 資料隔離 + 機密外部化）成為前置基礎**——其他軌都建立在「資料屬於某個使用者」之上。

關鍵利多：JWT **已內含 `sub`=userId**（`backend/src/Chi.TradeLog.Services/Auth/AuthService.cs:68`）且 `Program.cs` 設 `MapInboundClaims=false`，身分已在每個 request 內，多租戶只需「加欄位 + 查詢帶 user 範圍」，**不需重寫認證**。

本計畫為**分階段路線圖**，依相依性排序，逐階段各自可驗證。工作量大，預期跨多個工作階段。

---

## Phase 1 — 安全 / 環境基礎（低風險，先做）
**目標**：正式環境不外洩 dev 機密；git 衛生。
- **機密外部化**：`backend/src/Chi.TradeLog.Api/appsettings.json` 的 `Jwt:Key` 與 `Database:ConnectionString` 改為「環境變數優先、appsettings 為 fallback」。在 `Program.cs`（讀 `JwtOptions`/`DatabaseOptions` 處，約 50–78 行）加 env 覆寫；`docker-compose.yml` 以 `${JWT_KEY}`/`${DB_CONNECTION}` 傳入；新增 compose 用 `.env.example`。
- **`.env` git 衛生**：`frontend/.gitignore` 與根 `.gitignore` 加 `.env`；`git rm --cached frontend/.env`（保留本機檔）。
- **密碼政策**（小）：`backend/src/Chi.TradeLog.Api/Validators/UserValidators.cs` 視需求提高最短長度/加複雜度；預設密碼維持但文件標註「首次登入須改」。
- **文件**：修 `database/DATABASE_SCHEMA.md` 把 `users` 從「待建立」更新為已建（含 `is_admin`，Migration 0006/0007）。
- **驗證**：以環境變數覆寫啟動 → JWT 用新金鑰簽發、DB 連線成功；`git status` 不再追蹤 `.env`。

## Phase 2 — 多租戶 / per-user 資料隔離（核心，最高風險）
**目標**：每位使用者只看得到/改得到自己的 platforms / accounts / symbols / tags / app_settings / trades / journal。
- **Schema（新 Migration）**：為使用者所有的表加 `user_id bigint NOT NULL REFERENCES users(id)`：`platforms`、`accounts`、`symbols`、`tags`、`app_settings`、`journal_entries`、`trades`。索引改 `(user_id, account_id, traded_on DESC)` 等。既有 seed 資料 backfill 給 alex 的 id。同步更新 `database/DATABASE_SCHEMA.md`。
- **讀身分**：Controller 由 `User.FindFirstValue(ClaimTypes.NameIdentifier / "sub")` 取 userId（token 已有 `sub`），往下傳到 Service→Repository 的 Condition/InfoModel（沿用既有分層物件，不繞層）。
- **Repository**：每個查詢 `WHERE user_id = @UserId`；每個 insert 寫入 `user_id`；跨資源（如 trades 查詢的 accountIds）驗證歸屬。代表檔：`Repositories/Trades/TradeRepository.cs`、`Repositories/Settings/*`、`Repositories/Journal/JournalRepository.cs`、`Repositories/Users/UserRepository.cs`。
- **Service/Common**：對應 InfoModel/Condition/DataModel 加 `UserId`；AutoMapper Profile 補映射。
- **Controller**：`TradesController`（尤其 `GetTradesAsync` 需擋非本人 accountIds）、`SettingsController`、`JournalController` 全部帶入 userId。
- **測試**：新增隔離整合測試（使用者 A 看不到 B 的 trades/settings/journal）；沿用 `tests/.../TestAuth/TestAuthHandler.cs` 產生不同使用者。
- **驗證**：docker 端到端 — 兩個使用者各自建帳戶/交易，互不可見；A 用 B 的 accountId 查詢 → 空或 403。

## Phase 3 — 去除原型假資料（Track B，接在多租戶後）
**目標**：畫面呈現真實資料，不再綁死 2026-07 / 合成歷史。
- **解除硬寫「今天」**：`frontend/src/lib/dateRange.ts` `TODAY`、`lib/metrics.ts` `CUR_MONTH_IDX`、`lib/reports.ts` `BASE_YEAR/MONTH`、`components/DateRangePicker` 預設月 → 改由 `new Date()` 動態推導（抽 `lib/today.ts` 共用）。同步更新對應 `*.test.ts`（測試改注入固定日期）。
- **移除合成歷史**：拔掉 `metrics.ts syntheticMonthEntries()` 與 `reports.ts buildMonthlyPerformance()` 的亂數月份，改為真實聚合；資料不足時走 Phase 5 的空狀態。
- **後端 seed**：目前只有 2026-07 一個月且屬單一使用者。改為相對「今天」生成或明確標為 demo；與多租戶 backfill 一致。
- **驗證**：跨月新增交易，權益曲線/月報反映真實資料，無假月份。

## Phase 4 — 功能補齊（Track D）
**目標**：CRUD 對稱、常見帳號操作齊備。
- **使用者管理**：後端補 `DELETE /api/users/{id}`、`PUT /api/users/{id}`（改名/改 email/切換 admin），含驗證與「不可刪除/降權自己最後一個 admin」保護；前端 `pages/settings/AccountSecuritySections.tsx` 的 `UserManagementSection` 加刪除（含確認）與編輯。
- **平台/帳戶改名**：後端補 `PUT /api/settings/platforms/{id}`、`/accounts/{id}`；前端 Settings 加 inline 改名。
- **Login 體驗**：「記住我」真正持久化（authStore + storage 選擇）；「忘記密碼」目前靠 admin reset — 前端補提示指向 admin（自助 email 流程需寄信基礎設施，暫列 out-of-scope）。
- **驗證**：建立/改名/刪除各資源；刪除最後一個 admin 被擋。

## Phase 5 — 前端 UX 打磨（Track C）
**目標**：狀態完整、可操作、可用鍵盤、能在窄螢幕用。
- **C1/C2 Loading/Error/Empty**：新增可重用 `Skeleton`、`ErrorState`、`EmptyState`（或 toast）；在 Dashboard/TradeLog/Calendar/Reports/Journal 依 TanStack Query `isLoading`/`isError` 接上。
- **C4 破壞性確認**：新增 `ConfirmDialog`（reuse 既有 `components/Modal`），套用到刪平台/帳戶/商品/標籤/使用者。
- **C3 表格**：Trade Log 加欄位排序 + 商品/標籤搜尋（`lib/` 純函式 + 測試）。
- **C5 無障礙**：`Modal` 加 focus trap + ESC + 還焦；`Dropdown` 加 ↑↓/Enter/Esc 與 `role="option"`/`aria-selected`；表頭 `scope="col"`。
- **C6 響應式**：新增行動/平板斷點；Topbar 窄螢幕改漢堡選單；表格與 Modal 窄螢幕處理（對照 `frontend/DESIGN_GUIDELINES.md`）。
- **C7 i18n**：`LoginCard` placeholder、品牌字、Dashboard/Journal 月份字改走 i18n（`en.json`/`zh-Hant.json` 同步補 key）。
- **驗證**：preview 逐頁看 loading/error/empty、鍵盤操作 Dropdown/Modal、mobile/tablet 版面。

## Phase 6 — 交付 / DX（Track E）
**目標**：別人能照文件跑起來、自動化把關品質。
- **README**：根 README（架構、docker-compose 快速上手、mock vs API 模式、demo 帳密 `alex@chitradelog.com` / `demo1234`、預設密碼 `changeme123`）+ 精簡 backend README（build/test/run）。
- **CI**：`.github/workflows/ci.yml` — push/PR 跑 `dotnet test` + `npm test` + `npm run build`。
- **Lint/Format**：補齊 ESLint 依賴（`frontend/package.json` 已有 `lint` script 但缺套件）+ 設定檔；加 Prettier；選配 husky pre-commit。
- **Ops 收尾**：`frontend/Dockerfile` 加 healthcheck；`.claude/launch.json` 補後端 dotnet 啟動設定。
- **驗證**：乾淨 clone → 照 README `docker compose up` 能登入用；CI 綠燈。

---

## 相依與建議節奏
- 順序：**1 → 2 →（3、4、5、6 相對獨立，可並行/挑選）**。Phase 2 是其他軌的地基且風險最高，建議獨立完成並在此**設檢查點**再往下。
- 每階段結束跑：後端 `dotnet test`、前端 `npx tsc -b` + `npm test` + `npm run build`，並用 preview / docker 端到端驗證。
- 全程遵循 `backend/CLAUDE.md`（三行 XML 註解、無 `sealed`、明確建構式、`is false`、FluentMigrator + 更新 SCHEMA）與 `frontend/CLAUDE.md`（CSS Modules + tokens、i18n 雙語、TanStack Query 不塞 Zustand）。

## 盤點附錄（發現來源，供追溯）
- 前端：全站無 error UI、多頁無 loading；Modal 無 focus trap、Dropdown 無鍵盤導覽；僅 1 個 `@media(max-width:1080px)`。
- 後端：`appsettings.json` 硬寫 JWT 金鑰與 DB 連線；`trades/accounts/...` 無 `user_id`，任何登入者可存取全部資料；密碼最短 6 碼。
- 交付：無根/後端 README、無 CI、`frontend/.env` 被 git 追蹤、`DATABASE_SCHEMA.md` 把 users 標「待建立」但已建。
