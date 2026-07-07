# 2026-07 完整日期模型遷移（修跨月炸彈）

> 狀態：**已完成（2026-07-07，趕在 7/31 死線前）**
> 完成紀錄：Trade 前後端全面改完整日期（前端 ISO 字串 / 後端 DateOnly）；Migration 0010 將
> journal_entries 唯一鍵由 day:int 遷移為 entry_date（既有列以 make_date(2026,7,day) 回填）；
> 月曆/報表/權益曲線區間為真實跨月過濾。已通過跨月端到端驗證（上月交易只出現在上月月曆等）。
> 原因：`Trade` 前端只存「當月第幾天」，整個 app 假設所有交易在本月——
> **8/1 起所有既有交易會集體錯位成 8 月**（月曆、報表、CSV 匯出全錯）。
> 後端 `trades.traded_on` 已存完整日期，重構重心在前端與介面層。

## Context
原型時代的簡化（day 1–31）已成最大結構債（見 `docs/ENGINEERING_SYSTEM.md` §3.3、§6#1）。
本計畫將 `Trade` 全面改用完整日期（ISO `yyyy-MM-dd`），使月曆各月顯示真資料、
權益曲線與月報自然跨月、匯出匯入不再拼湊日期。

## ⚠️ 探索發現的連鎖影響：Journal 唯一鍵
`journal_entries` 唯一鍵含 `day:int` → 跨月會撞鍵（8/3 與 7/3 的同商品日記互蓋）。
**必須隨本計畫一併遷移**，不可只改 trades。

## B1 後端
- **Trades 介面層 date 化**：
  - `TradeViewModel.Day:int` → `Date: DateOnly`（System.Text.Json 序列化為 `"2026-07-03"`）。
  - `CreateTradeParameter` / `UpdateTradeParameter` / `ImportTradeRow` 的 `Day` → `Date: DateOnly`；validators 改驗日期非 default。
  - `SaveTradeInfo.Day` → `TradedOn: DateOnly`；`TradeService.BuildDataModel` 直接用 `info.TradedOn`——
    **刪除「假設本月 + day 夾住」邏輯**；貼上匯入列日期由 `OpenedAt` 推導。
- **Journal 遷移（Migration 0010）**：
  - 加 `entry_date date`；既有列以 `make_date(2026, 7, day)` backfill（現有資料皆 2026-07 建立）；
  - 唯一鍵 `uq_journal_entry` 改 `(user_id, account_id, symbol, entry_date)`；移除舊 `day` 欄；
  - Journal 各層（`JournalQueryParameter`/`SaveJournalParameter`/Info/Dto/DataModel/Repository SQL/Controller）`day:int` → date；
  - 同步更新 `database/DATABASE_SCHEMA.md`。
- 測試：`TradeServiceWriteTests`（日期斷言改 DateOnly）、`JournalServiceTests`、endpoint stubs。

## B2 前端
- `types/trade.ts`：`day: number` → `date: string`（ISO）。**以 `npx tsc -b` 的編譯錯誤為重構地圖**，逐檔修：
  - `lib/metrics.ts`：`buildCalendar` 改「依顯示中的年月過濾交易→按日聚合」（各月都有真資料）；
    權益曲線按 date 排序、label 真日期；`EquityRange`（month/quarter/year/all）變成**真的區間過濾**。
  - `lib/reports.ts`：weekday 用真日期；`buildMonthlyPerformance` 依月分組 → 真的多月長條。
  - `lib/csv.ts`：匯出用 `trade.date`、匯入解析完整日期；刪 `dayToISO`。
  - `lib/tradeForm.ts`：`TradeFormInput.day` → `date`；刪 day 夾住。
  - `lib/pasteImport.ts`：輸出 `date`（由 openedAt 推導）。
  - `lib/tradeSort.ts`：`'day'` → `'date'`（ISO 字串比較即正確排序）。
  - `lib/seededTrades.ts` / `mockTradeStore.ts`：mock 種子生成完整日期（與後端 seed 同月同日，維持一致）。
  - `lib/journal.ts` + `features/journal/*`：journal key 改 date 字串。
  - UI：`AddEditTradeModal` day 數字輸入 → `<input type="date">`（tokens 樣式）；
    `TradeLog`/`DayDetailModal`/`JournalEditor` 顯示日期由 `trade.date` 推導（刪 `currentMonthIdx` 拼月份字）；
    `Dashboard`/`CalendarPage` 配合 `buildCalendar` 新簽章。
- 測試：metrics/reports/csv/dateRange/tradeForm/tradeSort/pasteImport/seededTrades 的 `*.test.ts` 更新
  （仍用 `setTodayForTesting`；**補跨月案例**：上月交易不出現在本月月曆、月報兩根柱）。

## B3 驗證（照 ENGINEERING_SYSTEM 1.2 驗證梯）
- docker 起後端 → 建一筆**上個月**日期的交易：月曆切上月看得到、本月看不到；
  權益曲線 `all` 跨月連續、`month` 只含本月；Reports 月報兩根月柱；
  CSV 匯出→匯入 round-trip 日期不變。
- Journal：既有 7 月日記仍讀得到（backfill 驗證）；新建跨月日記 key 不互蓋。
- 前後端計算鏡射（`BuildDataModel` ↔ `computeTradeFields`）同步修改並確認（ENGINEERING_SYSTEM 2.3）。
- L5：psql 抽查 `traded_on` / `entry_date`。

## 風險備註
- 重構面廣但編譯期可見（tsc 安全網）；風險集中在**語意**：月曆過濾、journal backfill。B3 是驗收關鍵。
- Journal key 遷移後，**mock 模式舊的記憶體日記 key 不相容**——mock store 屬展示用可接受重置，實作時於
  `mockJournalStore` 註明。
- 完成後更新 `docs/ENGINEERING_SYSTEM.md`：§3.3 改為「已修復」、§6 移除第 1 項、
  刪除 §2.3 中 day 夾住的公式描述。
