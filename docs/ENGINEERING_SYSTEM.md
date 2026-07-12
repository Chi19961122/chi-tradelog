# ENGINEERING_SYSTEM — Chi.TradeLog 軟體開發系統

> **讀者是接手本專案的 AI 開發代理**（Claude、GPT/Codex 或其他模型）。
> 本檔把已經在真實開發中驗證過的工程判斷制度化：哪些規則不可違反、哪些坑已經踩過、
> 哪些債已知且排了序。**對話記憶不可靠、模型會更換——只有寫在這裡的東西會留下來。**
>
> 使用方式：開工前讀完第 0–2 節；動到相關領域再查第 3–6 節；收工照 1.2 驗證梯與 1.4 commit 制度。

---

## 0. 文件地圖與優先序

| 文件 | 內容 | 何時讀 |
| --- | --- | --- |
| `CLAUDE.md`（root / backend / frontend） | 硬規範：技術棧、分層、命名、註解、樣式 | 永遠 |
| **本檔** `docs/ENGINEERING_SYSTEM.md` | 流程制度、不變量、領域知識、陷阱、債務 | 開工前 |
| `database/DATABASE_SCHEMA.md` | schema 唯一事實來源 | 動任何 SQL 前 |
| `frontend/DESIGN_GUIDELINES.md` | 視覺基準（tokens、元件、檢查清單） | 動任何 UI 前 |
| `docs/plans/` | 實作計畫（含未完成工作的交接狀態） | 接手任務前查索引 |

規範衝突優先序：**分區 CLAUDE.md > 本檔 > 既有程式碼風格 > 通用慣例**。
本檔與 CLAUDE.md 衝突時，以 CLAUDE.md 為準並回報使用者修正本檔。

---

## 1. 開發循環（必遵守）

### 1.1 標準流程

```
讀計畫/規範 → 全端功能先做後端（migration → 各層 → 測試）再做前端
→ 跑 1.2 驗證梯 → 依 1.4 commit → 更新文件（SCHEMA.md / plans 狀態 / 本檔的債務清單）
```

- 大型工作**分階段**執行，每階段獨立可驗證；風險最高的階段（例如 schema 遷移）完成後設檢查點再前進。
- 新任務先在 `docs/plans/` 建計畫檔（`YYYY-MM-描述.md`，開頭寫 Context、分階段步驟、驗證方式），
  狀態走 `規劃中 → 進行中 → 已完成 / 擱置`，並登記到 `docs/plans/README.md` 索引。
- **被中斷或未完成的工作，必須把交接狀態寫回計畫檔**（做到哪、下一步、已定案的設計決策）。

### 1.2 驗證梯（L1–L5）

沒有爬到 L4 的功能**不得宣稱完成**。寫入類功能要到 L5。

| 層級 | 指令 / 動作 |
| --- | --- |
| L1 靜態 | `cd backend && dotnet build`；`cd frontend && npx tsc -b && npm run lint` |
| L2 單元 | `dotnet test`（backend）；`npm test`（frontend，Vitest） |
| L3 建置 | `cd frontend && npm run build` |
| L4 執行期 | `docker compose up -d postgres backend` + 瀏覽器實測受影響路徑（mock 與 API 雙模式） |
| L5 資料庫 | `docker exec chitradelog-postgres-1 psql -U postgres -d chitradelog -c "SELECT ..."` 確認持久化 |

- 新增／修改 `frontend/src/lib/` 純函式 → **必附** 對應 `*.test.ts`（時間相關用 `setTodayForTesting` 注入固定日期）。
- 新增／修改後端 Service 邏輯 → **必附** xUnit 測試（測試替身放測試檔內或 `tests/.../TestDoubles/`）。
- 解析器類（CSV、貼上匯入）→ 用**真實樣本做黃金案例測試**（golden sample），不要只測理想輸入。

### 1.3 手動冒煙 Checklist（Playwright 落地前的過渡）

改動影響面大（狀態管理、auth、共用元件、schema）時，照表操作：

**Mock 模式**（`frontend/.env` 不存在或 `VITE_API_BASE_URL` 為空；改動 `.env` 後必須重啟 dev server）
1. 任意帳密登入成功
2. 六個畫面（Dashboard / Trade Log / Calendar / Reports / Settings / Journal modal）載入、console 無紅字
3. 新增交易 → 表格出現；點列開 Journal → 打字 → 關閉重開 → 內容仍在

**API 模式**（`VITE_API_BASE_URL=http://localhost:5079` + docker 後端）
1. `alex@chitradelog.com` / `demo1234` 登入（demo admin）
2. Dashboard KPI 有真實數字；月曆日格點開的明細加總 = 日格損益
3. Settings：admin 看得到 Users 區塊；mock 模式看不到（Password/Users 為 API-only）
4. 動到多租戶相關 → 用第二個使用者驗證互不可見（新使用者預設密碼 `changeme123`）

**清理**：驗證產生的測試資料（使用者、交易、日記）要刪掉或在回報中明確標註留存了什麼。

### 1.4 Commit 制度

- **每個通過驗證梯的階段／功能，立即 commit**。不准累積多個階段不 commit（本專案曾一次堆積六個
  Phase 數千行未 commit——這等於整段工程沒有還原點，嚴禁再犯）。
- Commit 訊息：繁中、`feat:`/`fix:`/`docs:`/`chore:` 前綴、一句話講清楚「做了什麼」。
- 每個 commit 內容必須**自洽可建置**（後端改動的相依檔案要在同一個 commit）。
- Commit 前 `git status` 全覽，確認沒有把驗證用暫存檔、`.env` 等混進去。
- push / PR 由使用者決定，AI 不主動 push。

### 1.5 瀏覽器自動化驗證的陷阱（實戰踩過）

- React 受控輸入不能直接設 `.value`：要用 native setter + `dispatchEvent(new Event('input',{bubbles:true}))`。
- **非同步初始化競態**：contentEditable／表單會在資料載入後由 effect 初始化。自動化打字太早，
  初始化會覆寫你打的字（曾造成「筆記沒存」的假陰性）。先等載入完成（等 UI 出現既有內容）再操作。
- **驗證持久化時，確認重開的是同一筆資料**：導航後排序／篩選會重置，`querySelector('tbody tr')`
  拿到的第一列可能已是別筆（曾誤判資料遺失，實際是點錯列）。用 DB 查詢（L5）做最終仲裁。
- 一次 eval 做一件事，步驟間 `await wait(...)` 給 React 時間；截圖工具可能 timeout，改用
  DOM 檢查 + network 記錄當證據。
- 瀏覽器端「PUT … [FAILED: net::ERR_ABORTED]」但狀態碼 204 = unmount 時 fetch 被瀏覽器中止、
  **伺服器其實已處理完成**，以伺服器狀態為準。

---

## 2. 架構不變量（違反即 bug）

### 2.1 後端分層與多租戶鐵律

資料流（見 backend/CLAUDE.md）：`Parameter → InfoModel → Condition → DataModel`，回程 `DataModel → Dto → ViewModel`。不跨層。

**多租戶（Migration 0008 起）**：
- 除 `users` 外，所有資料表都有 `user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE`。
- `UserId` **一律由 Controller 從 JWT `sub` claim 填入**（`ApiControllerBase.CurrentUserId`），
  絕不接受 client 傳入、絕不在 Service/Repository 內猜。
- 每條 SQL 的 WHERE / INSERT 都帶 `user_id`。
- **跨資源引用必驗歸屬**：例如寫入交易前用 `ISettingsRepository.AccountExistsAsync(accountId, userId)`
  確認帳戶屬於該使用者，不屬於 → Service 回 `null` → Controller 404。

**新增資料表配方**（照做不會漏）：
1. 讀 `DATABASE_SCHEMA.md` → 2. FluentMigrator migration（含 `user_id` + CASCADE FK；改既有表一律
   nullable/backfill 相容，不做破壞性變更）→ 3. DataModel/Dto/Info/Condition/Parameter/ViewModel +
   AutoMapper Profile → 4. Repository（user 範圍 SQL）→ 5. Service → 6. Controller（CurrentUserId）→
   7. Validator → 8. xUnit → 9. **同步更新 `DATABASE_SCHEMA.md`**。

**保護規則**：系統至少保留一位 admin（刪除／降權最後一位 admin → 409）；密碼一律 BCrypt；
新使用者由 `UserService.DefaultPassword`（`changeme123`）建立並回傳給 admin 轉交。

### 2.2 前端狀態與雙模式

- **mock-first 雙模式**：`lib/apiConfig.ts` 的 `API_BASE_URL` 是唯一開關。每個功能要嘛兩種模式都能動
  （mutation hooks 內分流），要嘛明確 gate（如 Settings 的 Password/Users 只在 API 模式渲染）。
- TanStack Query = 伺服器資料；Zustand = UI/偏好。**不得把 API 資料塞進 Zustand**
  （settings hydration 是唯一例外，走 `useSettingsController`）。
- 時間一律經 `lib/today.ts`（`today()/currentYear()/currentMonthIdx()`）；**任何地方硬寫日期＝bug**。
- 破壞性操作一律過 `components/ConfirmDialog`；查詢頁面要接 `components/QueryState`
  的 Loading/Error/Empty。
- **contentEditable 防資料丟失模式**（JournalEditor 為範本）：innerHTML 鏡射到 state、
  `dirtyRef` + 700ms debounce 儲存、**unmount 時 flush**（透過 effect 更新的 `saveRef` 取得最新閉包）。

### 2.3 前後端計算鏡射（改一邊必改另一邊）

`TradeService.BuildDataModel`（C#）與 `lib/tradeForm.computeTradeFields`（TS）**必須維持相同語意**：

- `pnl = 明確帶入值 ?? (Long ? exit-entry : entry-exit) × qty`（帶入值優先——期貨合約乘數，見 3.1）
- `r = 有停損 ? round(pnl / (|entry − stopLoss| × qty), 2) : round(pnl / 100, 2)`
  （真實風險優先；無停損維持近似值 fallback。風險為 0——停損 = 進場價——也走 fallback）
- `holdingMinutes = 有 openedAt+closedAt ? 兩者差的分鐘數 : 確定性亂數 fallback`
- 交易日期直接採用輸入的完整日期（前端 ISO 字串 / 後端 DateOnly）；`tags` 空 → `['manual']`；`sym` 大寫

改任何一邊的公式，另一邊與雙方測試（`TradeServiceWriteTests` / `tradeForm` 相關測試）同步改。

### 2.4 Auth 不變量

- JWT claims：`sub`（userId）、`email`、`name`、`admin`；`Program.cs` 設 `MapInboundClaims=false`
  → 後端一律用**原始 claim 名稱**讀取。
- 12 小時效期，前端到期前 5 分鐘自動 refresh；「記住我」決定 localStorage（跨工作階段）或
  sessionStorage（關瀏覽器登出），refresh 沿用原儲存區。
- **email 是 refresh 與改密碼的身分鍵**：任何「改 email」的端點，成功後**必須回發新 token**
  （否則舊 token 的 email claim 失效，下一次 refresh 401 → 被登出）。實作個人檔案功能時這是關鍵，
  見 `docs/plans/2026-07-settings-profile.md`。
- 機密走環境變數：`Jwt__Key`、`Database__ConnectionString`（compose 由根目錄 `.env` 的
  `JWT_KEY`/`POSTGRES_PASSWORD` 注入，範例見 `.env.example`）。`.env` 永不進版控。

---

## 3. 領域事實（血淚換來的，違反會產生「數字錯誤」級 bug）

### 3.1 期貨損益不能用價差算

YM 每點 $5、MNQ 每點 $2（各商品乘數不同）。`(exit−entry)×qty` 對期貨**必然算錯**
（實例：YM short 2 口 73 點，價差算出 $146，真實為 $723）。
→ 原則：**外部報表的金額是事實，重算是推測**。匯入時信任報表 `Net P&L`，後端「有給就用」。

### 3.2 券商報表的虧損常不帶負號

報表用顏色標虧損、金額印正數（實例：MNQ short 價格上漲＝虧損，報表印 `$167.50`）。
→ `lib/pasteImport.ts` 的定案處理：**盈虧方向由「價差×方向」推導、金額取報表值**；
報表值本身帶 `-` 或括號則直接視為虧損。

### 3.3 Trade「day-only」日期模型（已於 2026-07-07 修復）

歷史陷阱：前端 `Trade` 曾只有 `day`（當月第幾天），跨月時所有交易會集體錯位。
**現況：已全面遷移為完整日期**——前端 `Trade.date` 為 ISO 字串、後端 DateOnly，
journal 唯一鍵也改為 `entry_date`（Migration 0010）。留此節作歷史教訓：
**任何新程式碼不得寫「假設本月」邏輯**；碰日期一律用完整日期 + `lib/today.ts`。

### 3.4 其他領域事實

- Journal key = `(user, accountId, symbol, entry_date)`：同商品同日**共用一篇日記**，是設計不是 bug。
- Journal 筆記是 HTML、貼圖以 base64 data URL 存進 DB text 欄位（大圖會膨脹，見第 6 節）。
- `charges`/`opened_at`/`closed_at` 只有「貼上匯入」會填；手動輸入為 NULL；
  Net P&L 已是扣除手續費後淨值（charges 僅供顯示，不參與計算）。
- 手動**編輯**交易會照價差重算 pnl → 期貨匯入的交易一經編輯損益就會壞（已知限制，見第 6 節）。
- seed 示範資料（migration 0002/0004/0006）屬於 demo 使用者 alex；新使用者由
  `UserService.CreateAsync` 植入預設 symbols/tags（與 migration 0004 清單一致，兩處同步改）。

---

## 4. 決策原則（判斷的轉移）

遇到沒有明文規範的情境，按這些原則決策：

1. **資料正確性 > UX 打磨 > 新功能**。這是記錄金錢的工具，錯的數字比醜的介面嚴重十倍。
2. **信任來源資料**：外部系統給的值（報表金額、時間戳）照存；只在來源沒給時才推算，並在註解寫明推算方式。
3. **相容擴充 > 破壞性變更**：schema 加欄位一律 nullable + backfill；API 加欄位一律選填；
   舊資料、舊 client 要能繼續動。
4. **修在正確的深度**：共用機制上疊特例＝訊號不對。抽共用（`JournalEditor`、`CalendarBlock` 的
   `cellMinHeight`、`runImport`）而不是複製貼上改一點。
5. **防資料丟失優先**：任何使用者輸入（筆記、表單）要能承受「打完字立刻關閉／切頁」。
6. **產品層級的取捨不要自己猜**：給使用者 2–4 個選項（含推薦與白話文理由）用選擇題確認。
   技術層級有慣例可循的，直接做，不要問。
7. **發現「重要但現行做法有風險」的事，主動提出**，即使與當前任務無關（例：未 commit 堆積、
   日期炸彈都是這樣浮上來的）。

---

## 5. 已知尖角（Sharp Edges）

| 尖角 | 說明 |
| --- | --- |
| 改 `frontend/.env` 後 | Vite **不會**熱載入環境變數，必須重啟 dev server |
| admin 改了某使用者的 email | 該使用者現有 session 的下一次 refresh 會 401 被登出（已知，暫可接受） |
| 編輯匯入的期貨交易 | pnl 被價差重算而變錯（第 6 節待修） |
| ESLint `react-hooks/set-state-in-effect` | 已在 `eslint.config.js` 關閉——本專案 modal「開啟時以 effect 初始化表單」是既定慣例 |
| `MapInboundClaims=false` | 讀 claim 要用原始名（`"sub"`/`"email"`），用 `ClaimTypes.*` 會拿到空值 |
| Dapper snake_case | SELECT 一律 `AS PascalCase` 明確對應，新增欄位別忘了加進 `SelectColumns` |
| FluentMigrator PK 名稱 | 舊表 PK 名可能是 `PK_xxx` 或 `xxx_pkey`，migration 裡兩種都 `DROP CONSTRAINT IF EXISTS` |
| 測試裡的今天 | 前端測試用 `setTodayForTesting(new Date(2026,6,4))` 注入；後端測試用 `DateTime.UtcNow` 動態推期望值，不寫死日期 |
| 貼上匯入解析器 | 券商名若剛好等於表頭標籤（如 "Broker"）會被剝除——極端 edge，測試資料避開即可 |
| demo DB 殘留 | 驗證會留下測試使用者/交易/日記；用 psql 清理或重建 volume（`docker compose down -v`）|
| AutoMapper 15 授權警告 | **已評估、接受，勿降版**：12.x 有未修補的 DoS 弱點（GHSA-rvv3-g6hj-g44x），community key 需年續。復議時優先考慮移除手寫（全案僅 20 個 CreateMap），詳見 `docs/plans/2026-07-healthcheck-fixes.md` |

**Windows 本機環境**：Docker Desktop 可能未啟動（啟動後要輪詢 `docker ps` 等 ready）；
連接埠：前端 dev 5173、後端 5079、容器前端 8080、postgres 5432；
Git Bash 中多行 `python -c` 管線會異常（exit 49），改用檔案或內建工具。

---

## 6. 結構債 Backlog（依優先序，動工前先在 docs/plans/ 開計畫）

1. **Playwright 冒煙測試**：把 1.3 的 checklist 自動化（登入 → 六頁載入 → 新增交易 → 日記存讀
   → mock/API 兩模式），CI 掛 mock 模式即可先行。完成後 1.3 降級為備援。
2. **編輯交易保留明確 pnl**：編輯表單帶回原 pnl，或後端 update 時「entry/exit/qty 未變就不重算」。
3. **Journal 貼圖出 DB**：base64 → 物件儲存或至少限制大小，避免 text 欄位無限膨脹。
4. **Token 撤銷**：登出/改密碼不使既有 token 失效（12h 內仍有效）；需黑名單或 token 版本號。
5. **忘記密碼自助流程**：現靠 admin 重設；自助需寄信基礎設施。
6. **admin 改 email 的 session 失效**（見第 5 節）：可在回應中提示使用者重新登入，或發事件通知。

> ~~完整日期模型遷移~~：**已於 2026-07-07 完成**（`docs/plans/2026-07-date-model-migration.md`）。
> 2026-07 產品路線圖八項（範本持久化→週報）亦已全數完成（`docs/plans/2026-07-product-roadmap.md`）。

---

## 7. 協作慣例（與使用者）

- 溝通一律**繁體中文**；程式註解繁中、命名英文（見 CLAUDE.md）。
- 使用者的需求描述通常很精簡（一兩句話）——先探索程式碼把需求落地成具體方案，
  **產品取捨用選擇題問**（2–4 選項、標推薦、白話文說明後果），不要開放式反問。
- 使用者會切換模型（Opus/Sonnet/Fable/GPT）與 session——**所有重要狀態寫進 repo 文件**
  （plans 的交接狀態、本檔的債務清單），不可依賴對話記憶。
- 回報要誠實：測試失敗就說失敗、跳過就說跳過、驗證留下的測試資料要交代。
- Demo 帳號 `alex@chitradelog.com`/`demo1234`（admin）；正式部署前必須在根目錄 `.env`
  設 `JWT_KEY` 與 `POSTGRES_PASSWORD`。

---

*本檔由 2026-07 系統優化 + Journal/匯入功能開發的實戰經驗提煉（Fable 5 撰寫）。
發現本檔與現實不符時：修正本檔並在 commit 訊息註明，這份文件的正確性就是制度本身。*
