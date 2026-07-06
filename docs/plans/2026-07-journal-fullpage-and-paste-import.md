# 2026-07 Journal 整頁化 + 貼上智慧匯入

> 狀態：**規劃中** ｜ 分支：`feature/系統優化調整`

## Context
兩個使用者提出的優化：
1. **Journal 整頁編輯**：目前單筆 Journal 是彈跳視窗（`JournalModal`，寬 560px），空間小、不好編輯長筆記/貼圖。要能從彈窗按一個鈕，切到**整頁 Journal** 專心編輯。
2. **貼上智慧匯入**：讓使用者直接貼上券商匯出的表格文字（如下例），系統**抓關鍵字自動解析成交易紀錄**匯入，免手動一筆筆輸入或轉 CSV。

現況關鍵事實（供實作對齊）：
- Journal 彈窗在 3 個頁面各自以本地 state 開啟並傳入 `trade`：`pages/tradeLog/TradeLog.tsx:294`、`pages/dashboard/Dashboard.tsx:98`、`pages/calendar/CalendarPage.tsx:77`。App 以 `uiStore.tab`（`TabKey`）切頁，**無 router**。
- Journal 內容以 `(accountId, symbol, day)` 為 key（`journalKey`），資料層 `useJournal`/`useJournalMutation` 已 API/mock 雙模式。
- 既有匯入路徑可重用：`lib/csv.ts parseTradesCsv()` → `TradeFormInput` → `features/trades/useTradeMutations.ts importTrades` →（API）`POST /api/trades/import`。TradeLog 匯入時另以 `useSettingsController.addSymbol/addTag` 持久化新商品/標籤。
- **Trade 資料模型**（`types/trade.ts`）現只有：`sym, side, entry, exit, qty, day(1–31), pnl, r, tags, holdingMinutes`。**無**時間戳、charges、broker/account 名稱欄位；`day` 為當月日數，時間只保留 `holdingMinutes`。**本計畫將擴充**：新增 `charges`、`openedAt`、`closedAt`（見 Feature 2 的模型/schema 變更）。

## 已定案決策（2026-07，使用者確認）
1. **P&L 來源**：**信任貼上的 Net P&L**，不重算（因期貨有合約乘數，重算會錯）。後端 import 改「有給 pnl 就用、沒給才重算」。
2. **保留 Charges 與進/出場時間戳**：擴充 Trade 模型 + DB schema 新增 `charges`、`opened_at`、`closed_at` 欄位（含 migration + 各層模型 + 前端顯示）。

---

## Feature 1 — Journal 整頁編輯

### 設計
把 Journal 主體抽成共用元件，讓「彈窗」與「整頁」共用同一份編輯 UI 與存檔邏輯，避免重複。

- **抽出 `JournalEditor`**（`pages/journal/JournalEditor.tsx`）：把 `JournalModal.tsx` 目前的 body（trade summary、stat tiles、tags、emotions、mistakes、notes 編輯器 + debounce 存檔那整段）搬進來，props：`trade: Trade`、`variant?: 'modal' | 'page'`。存檔/dirty/flush 邏輯原封不動搬過來。
- **`JournalModal`** 改為薄殼：`<Modal>` 內放 `<JournalEditor trade variant="modal" />`，並在標題列加一顆「展開整頁」icon 鈕（reuse `components/Icon`，如 expand/maximize 圖示）。
- **`JournalPage`**（`pages/journal/JournalPage.tsx`）：整頁版面（頁首含返回鈕 + 標題），內放 `<JournalEditor trade variant="page" />`，寬度放大（如 max 860–960px、notes 編輯區更高）。
- **導覽狀態**：在 `uiStore` 加 `journalPageTrade: Trade | null` + `openJournalPage(trade)` / `closeJournalPage()`。`App` 在 `journalPageTrade !== null` 時**改渲染 `<JournalPage>` 取代目前 tab 內容**（返回鈕呼叫 `closeJournalPage()` 回到原 tab）。
- **接線**：`JournalModal` 的展開鈕 → `openJournalPage(trade)` 並關閉彈窗。3 個開啟點不需改動（仍先開彈窗，使用者再選擇展開）。

### i18n
新增 `journal.openFullPage` / `journal.back`（`en.json` + `zh-Hant.json` 同步）。

### 驗證
- TradeLog 點一列 → 彈窗 → 按展開 → 進整頁、內容一致；編輯後返回，存檔狀態正確（用既有 dirty/flush，切頁等同關閉要 flush）。
- 確認 debounce 存檔在整頁模式也運作（mock + docker）。

---

## Feature 2 — 貼上智慧匯入（Paste Import）

### 目標輸入格式（使用者實例）
一段**以換行分隔**的區塊文字：先一個標題區塊（`Trades / Broker / Account Name / Instrument / Open time / Close time / Side / Quantity / Entry Price / Exit Price / Net P&L / Charges / Tags`），接著多筆「記錄區塊」，每筆以 `Details` 行作為分隔。單筆欄位順序：
```
Broker        Lucid Trading
Account Name  LFE025-U...-TEST014
Instrument    YM
Open time     2026/7/3 下午3:24:25
Close time    2026/7/3 下午4:03:21
Side          short
Quantity      2
Entry Price   $53,287.00
Exit Price    $53,214.00
Net P&L       $723.00
Charges       $7.00
Tags          (可能空白)
Details       ← 分隔
```

### 新解析器 `lib/pasteImport.ts`
- `parsePastedTrades(text): TradeFormInput[]`（回傳型別沿用既有 `TradeFormInput`，好接 `importTrades`）。
- 流程：切行 → 以 `Details` 為界切成 chunk → **跳過標題 chunk**（判斷：含 `Broker`/`Instrument` 等 label 且無 `$` 金額）→ 每個資料 chunk 依序取 11 個已知欄位，其餘視為 Tags。
- 欄位正規化：
  - 金額（Entry/Exit/Net P&L/Charges）：去 `$`、去千分位逗號、`parseFloat`；**負值**支援 `-` 前綴與 `(1,234.00)` 括號記法。
  - 時間 `2026/7/3 下午3:24:25`：解析 `上午/下午`（AM/PM）→ 產出 ISO 時間戳存入 `openedAt`/`closedAt`；同時取「當月日數」當 `day`、`holdingMinutes = round((close - open) / 60000)`。
  - `charges`：去 `$`/逗號後存入 `charges`；`pnl` 取 Net P&L（見下方 P&L 決策，帶入不重算）。
  - `side`：`short` → `Short`，其餘 → `Long`。
  - `sym`：Instrument 轉大寫。
  - Tags：有值以逗號/分號切；無值給 `['manual']`。
- 容錯：chunk 欄位數不足就跳過；整段無有效 chunk 回 `[]`。
- **測試** `lib/pasteImport.test.ts`：用使用者這 5 筆做黃金案例（day=3、short、金額去符號、YM/MNQ 都過），加負 P&L、空 Tags、缺欄位案例。

### P&L：用「貼上的 Net P&L」而非重算（已定案）
使用者範例是**期貨**（YM 每點 $5、MNQ 每點 $2），P&L **不是** `(exit−entry)×qty`（驗證：YM short 2 口 53287→53214＝73 點 ×$5×2 −$7 手續費 ＝ **$723**，正是貼上的 Net P&L）。目前 `importTrades` 走後端 `POST /api/trades/import`，而後端 `TradeService` 會用 entry/exit/qty 重算 pnl，對期貨會算錯。
- **做法**：匯入時**帶入明確 pnl**，後端「有給就用、沒給才重算」。改：`ImportTradeRow`（後端 Parameter/Info/驗證）新增可選 `pnl`（與 `charges`、`openedAt`、`closedAt`）；`TradeService.ImportTradesAsync` 當 `pnl` 有值時直接採用、否則維持既有重算。
- `R` 無停損資訊可推 → 預設 0（留給使用者於預覽/日記補）。

### 模型 / schema 變更：新增 charges 與進出場時間戳（已定案）
決策為**保留 Charges 與時間戳**，需全端擴欄：
- **DB migration**（FluentMigrator，新號碼）：`trades` 表新增 `charges numeric NULL`、`opened_at timestamptz NULL`、`closed_at timestamptz NULL`；同步更新 `database/DATABASE_SCHEMA.md`。既有列這三欄為 NULL（向後相容）。
- **後端各層**：`TradeDataModel`、`TradeDto`、`SaveTradeInfo`/`ImportTradeRow`、對應 Parameter/ViewModel 加 `Charges`/`OpenedAt`/`ClosedAt`；`TradeRepository` 的 INSERT/SELECT/`InsertManyAsync` 帶這三欄；AutoMapper Profile 補映射；`TradeService` 匯入時把貼上的值寫入（`day` 與 `holdingMinutes` 可由 `openedAt`/`closedAt` 推導，若時間戳為空則沿用現行 `day`/holding 計算）。
- **前端型別/顯示**：`types/trade.ts` `Trade` 加 `charges?: number`、`openedAt?: string`、`closedAt?: string`（皆選填，手動新增交易可留空）。Journal/TradeLog/預覽視需要顯示手續費與進出場時間（時間顯示格式沿用 i18n）。
- **相容性**：三欄皆 nullable、選填，手動 Add/Edit Trade 與現有資料不受影響；僅貼上匯入會填入。
- 註：此 migration 與另一份路線圖 Phase 2（trades 加 `user_id`）都動 trades 表 → migration 依序執行即可，不衝突。

### 帳戶對應
- Broker / Account Name（貼上的文字）**不對應** app 的 `accountId`（如 `a1`）→ 匯入一律進**目前作用中的帳戶**（`activeAccountIds` 首個），與現行 CSV 匯入一致。（未來可做「帳戶名稱對應表」。）

### UI
- TradeLog 工具列新增「貼上匯入」鈕（放在既有 Import/Export CSV 旁；i18n `tradelog.pasteImport`）。
- 開 `PasteImportModal`（reuse `components/Modal`）：大 `textarea` 貼上 → 即時 `parsePastedTrades` → **預覽表**（日期/商品/方向/數量/進出/淨損益/標籤，可刪列）→「匯入 N 筆」確認。
- 確認 → `importTrades.mutate({ accountId, trades })` 一次送出 + `settings.addSymbol/addTag`（新商品/標籤去重持久化），與現行 CSV 匯入同一路徑。
- 解析不出時顯示提示（走 Phase「錯誤狀態」慣例或簡易 inline 訊息）。

### i18n
`tradelog.pasteImport`、`pasteImport.title/subtitle/placeholder/preview/confirm/empty/parsed`（`en` + `zh-Hant` 同步）。

### 驗證
- 貼上使用者這段 → 預覽 5 筆、day=3、YM/MNQ 正確、Net P&L 正確帶入 → 匯入後 TradeLog 出現 5 筆且 pnl 與貼上一致（docker API 模式，確認後端採用帶入 pnl）。
- 負 P&L、含 Tags、含多餘空行的貼上皆正確。
- 前端 `npx tsc -b` + `npm test`（含新 `pasteImport.test.ts`）+ `npm run build`；後端 `dotnet test`（import 帶 pnl 的新案例）。

---

## 相依 / 順序
- Feature 1、2 相互獨立，可分開做。
- Feature 2 內部建議順序：**先做後端擴欄（migration + 各層 charges/openedAt/closedAt + import 帶入 pnl）→ 再做前端解析器 + 預覽 UI**，因前端要送這些新欄位給後端。
- 全程遵循 `backend/CLAUDE.md`（三行 XML 註解、無 `sealed`、明確建構式、FluentValidation、`is false`、FluentMigrator + 更新 SCHEMA）與 `frontend/CLAUDE.md`（CSS Modules + tokens、i18n 雙語、`lib/` 純函式配 `*.test.ts`、TanStack Query 不塞 Zustand）。

## 決策紀錄
- ✅ P&L：信任貼上的 Net P&L（不重算）。
- ✅ 保留 Charges 與 Open/Close 時間戳：擴 Trade 模型 + DB schema（三個 nullable 欄位）。
