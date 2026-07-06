# 2026-07 產品路線圖（新功能優先序）

> 狀態：**規劃中** ｜ 使用者已確認以下八項（兩批確認：功能 1/3/4/7 為第一批，2/5/6/8 為第二批
> 「行為改變」主題），排序依「相依性 + 投報率」。
> 前置：`2026-07-settings-profile.md`（個人檔案）與 `2026-07-date-model-migration.md`（日期模型）先完成——
> 尤其 #4 進階統計與 #5 行為分析**依賴完整日期模型**。
>
> 主軸判斷：交易日誌的本質是**改變行為**——最高價值的功能是把「已經在記錄的資料」
> （情緒標籤、錯誤清單、進出場時間戳）變成量化洞察，而非再添記錄欄位。

## 已排序（使用者確認）

### 1. Journal 範本持久化（最小、近似修 bug，先做）
現況：`JournalEditor.tsx` 的 `sessionTemplate` 是模組層記憶體變數——「Set Template」設定的範本
**重新整理就消失**。
- 後端：範本存 per-user（建議 `app_settings` 加 nullable `journal_template text` 欄，
  照 ENGINEERING_SYSTEM 2.1 配方走 migration + 各層；或併入未來 user preferences 表）。
- 前端：`Set Template` 寫後端、開啟編輯器時載入；mock 模式存 localStorage。
- 驗證：設範本 → 重新整理 → Apply Template 仍是自訂內容；兩個使用者範本互不影響。

### 2. 日記提醒（極小、養習慣）
現況：有交易但沒寫日記，沒有任何提示。
- **MVP 只檢查「今天」**：對今天的每筆交易 key（account, symbol, 今天）查日記是否存在
  （沿用既有 `GET /api/journal`，筆數少可接受）→ Topbar 小紅點 + tooltip
  「今天有 N 筆交易還沒寫日記」，點擊跳 Trade Log。
- mock 模式查 `mockJournalStore`。後續若要看歷史缺漏，再加後端彙總端點
  `GET /api/journal/days?from&to`（回傳有日記的日期清單）。
- 驗證：今天有交易且無日記 → 紅點出現；補寫日記 → 紅點消失。

### 3. 真實 R 值（停損欄位）
現況：`R = pnl / 100` 是佔位近似，對交易檢討意義有限。
- Schema：`trades` 加 nullable `stop_loss numeric(18,4)`（相容擴欄）。
- 計算：有停損 → `R = pnl / (|entry − stop_loss| × qty)`（先以現貨語意；期貨的每點價值待
  多券商需求明確後再擴充）；無停損 → 維持現行 fallback。前後端計算鏡射兩邊同步
  （`TradeService.BuildDataModel` ↔ `lib/tradeForm.computeTradeFields`）。
- UI：`AddEditTradeModal` 加停損欄（選填）；貼上匯入格式含停損時帶入。
- 驗證：含停損的交易 R 值正確；Reports 的 R 分佈圖反映真實 R。

### 4. 進階交易統計（依賴日期模型完成）
- **連勝/連敗**（目前與最長）、**期望值**（勝率×平均獲利 −敗率×平均虧損）、**最佳/最差交易日**。
- **進出場時段分析**：用貼上匯入的 `openedAt` 時間戳分時段（如每小時桶）統計勝率/損益——
  **只統計有時間戳的交易**，無時間戳者明確排除並標示樣本數。
- 落點：計算放 `lib/metrics.ts`/`lib/reports.ts` 純函式 + 測試；UI 進 Reports 頁（時段分析）
  與 Dashboard（連勝/期望值可作 KPI 卡候選，走既有 `useKpiCards`/`kpiVisible` 自訂機制）。

### 5. 行為分析：情緒 × 績效 + 錯誤成本（緊接 #4，同屬 Reports 聚合）
把日記裡**已經在記錄**的情緒標籤與錯誤清單變成量化洞察——寫日記的終極回報。
- 後端：Journal 目前只有單鍵查詢 → 新增「取本人全部日記」端點（`GET /api/journal/all`，
  走 `CurrentUserId`，回傳輕量欄位：key + emotions + 勾選的 mistakes，**不含 notes HTML** 避免大 payload）。
- 聚合（`lib/` 純函式 + 測試）：以 journal key（account, symbol, date）關聯對應交易的損益——
  - **情緒×績效**：各情緒標籤的關聯交易平均/累積損益、出現次數（「FOMO 的日子平均 −$120」）。
  - **錯誤成本**：各錯誤項（checked=true）的累積損益與次數（「移動停損花了你 $1,240」）。
- UI：Reports 新區塊（情緒長條圖 + 錯誤成本表，Recharts + 既有卡片樣式）；樣本數過少（<3）標示灰色。
- 驗證：造 2–3 篇含情緒/錯誤的日記 → 數字可手算對上；無日記時空狀態。

### 6. 紀律規則檢核（用時間戳，行為警示）
- 規則儲存 per-user（建議 `app_settings` 加 `discipline_rules jsonb`，或併入 preferences）。
  MVP 兩條內建可配置規則：
  - **單日最大筆數 N**（過度交易）——所有交易可檢測。
  - **報復性交易間隔 M 分鐘**：虧損平倉後 M 分鐘內開新倉 → 違規。
    需 `openedAt/closedAt`，**只對有時間戳的交易檢測**（貼上匯入的）並標示檢測範圍。
- 檢測為 `lib/discipline.ts` 純函式（輸入 trades + 規則 → 違規清單）+ 測試。
- UI：Settings 加規則設定卡；月曆違規日顯示警示 icon；Reports 或 Dashboard 列違規摘要。
- 驗證：造違規資料（同日 N+1 筆、虧損後 M−1 分鐘進場）→ 正確標記；規則改參數即時反映。

### 7. 全資料匯出備份
- 後端：`GET /api/export` 回傳本人全部資料 JSON（platforms/accounts/symbols/tags/trades/journal/設定），
  走 `CurrentUserId` 範圍；檔名含日期。
- 前端：Settings 加「匯出全部資料」鈕（reuse `downloadTextFile`）。
- 驗證：匯出 JSON 結構完整、只含本人資料（用第二使用者驗隔離）。

### 8. 週報自動生成（消費 #4/#5 的產出，最後做）
- 選定週（預設上週）→ 彙整：週損益/筆數/勝率、最佳與最差交易、該週勾選的錯誤 recap、
  情緒分佈、（有規則時）違規次數。計算放 `lib/weeklyReport.ts` 純函式 + 測試。
- UI：Reports 加「Weekly Review」區（週選擇器沿用 `dateRange` 工具）+ 一鍵複製 Markdown；
  「自動」= 開啟 app 時上週報告未讀則顯示提示（localStorage 記已讀），不需排程基礎設施。
- 此項取代原候補的「週/月回顧工作流」。

## 候補（未排期，需求明確再提）
- Dashboard 目標進度（月損益/勝率目標）
- 多帳戶績效比較（Reports 加帳戶維度）
- 手續費統計報表（`charges` 已入庫，僅差聚合顯示）
- 多券商貼上格式（`lib/pasteImport.ts` 現支援單一格式；新格式來了再擴 parser + 黃金案例測試）
- 策略 Playbook（標籤升級為含進場條件的策略手冊，各 playbook 獨立績效）
- 回撤警戒線（權益自高點回落逾自訂 % → Dashboard 橫幅）
- PWA 安裝（響應式已具備，包 manifest + service worker）

## 已排除（使用者明確決定不做，2026-07-07——請勿再提案）
- **未平倉部位追蹤**：需即時報價來源，架構影響大。
- **AI 日記洞察**（LLM API 總結/找模式）：有 API 成本。
（若日後需求改變，由使用者主動重啟。）

## 技術債（與功能無關，見 ENGINEERING_SYSTEM §6）
Playwright 冒煙、編輯交易保留明確 pnl、Journal 貼圖出 DB、token 撤銷、忘記密碼自助、
admin 改 email 的 session 失效——依該檔優先序處理。
