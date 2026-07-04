# CLAUDE.md — Chi.TradeLog 前端規範

> 本檔定義 `frontend/` 的架構、樣式、狀態與慣例。根目錄總覽見 [`../CLAUDE.md`](../CLAUDE.md)。

## 專案是什麼
`frontend/` 是 **Vite + React + TypeScript 單頁應用（SPA）**，用來重建 `design_handoff_chi_tradelog/` 的設計稿。畫面：Dashboard（Overview）、Trade Log、Calendar、Reports、Journal（modal）、Settings、Login。

設計稿 `Trading Journal.dc.html` 為**唯讀參考**（用來取得精確 copy、計算值與互動邏輯），**不得直接沿用其 inline style 或出貨該檔**。

## 架構分層
```
src/
├─ app/          # 進入點、router、providers（QueryClient、i18n、theme/Zustand）
├─ pages/        # 各畫面組裝：dashboard / tradeLog / calendar / reports / settings
├─ components/   # 無狀態共用 UI：Topbar、Card、Pill、Modal、Donut、SegmentedControl…
├─ features/     # 依領域：trades / accounts / journal / kpi（含 hooks / api / store）
├─ lib/          # 純函式與工具：metrics（KPI 計算）、csv、api client、hooks（outsideClick）
├─ i18n/         # en.json、zh-Hant.json、i18n setup
├─ styles/       # tokens.css（CSS 變數 dark/light）、globals.css
└─ types/        # Trade、Account、Platform、Kpi… 型別
```
- **pages**：只負責組裝與資料串接，不塞複雜計算。
- **components**：純展示、可重用，透過 props 驅動。
- **features**：領域邏輯（query hooks、mutation、領域 store）。
- **lib**：無 React 相依的純函式（可獨立單元測試），交易衍生指標計算放這裡。

## 樣式規範
> 視覺與版面的完整基準見 [`DESIGN_GUIDELINES.md`](DESIGN_GUIDELINES.md)（色彩 tokens、字體、間距、元件、互動慣例、新畫面檢查清單）。動任何 UI 前先讀它。

- **一律使用 `styles/tokens.css` 的 CSS 變數**（design tokens），**禁止硬寫色碼**。dark 為預設主題、EN 為預設語言。
- 元件樣式用 **CSS Modules**（`Component.module.css`），不用 inline style 堆疊、不引入其他 CSS-in-JS。
- 圓角、邊框、間距、字型沿用 tokens：圓角 pills `999px`、cards `14–18px`、inputs `8–10px`；卡片邊框 `1px` 的 `--line`。
- 字型：UI 用 **Inter**；**所有數字／數值一律 IBM Plex Mono**。
- theme 切換靠切 `:root` / `[data-theme]` 上的 CSS 變數，不逐元件改色。

## 狀態與資料
- **Zustand**：UI 與使用者偏好狀態 — `theme`、`lang`、`activeAccountIds`、modal 旗標（`tradeModalOpen`/`journalModalOpen`/`dayDetailOpen`）、filters、pagination、KPI 顯示設定。
- **TanStack Query**：**所有伺服器資料**（trades、accounts、settings）。**不得把 API 資料塞進 Zustand。**
- **Recharts**：所有圖表（equity curve area+line、trade score radar、reports 各圖）。設計稿的手繪 SVG 圖表換成 Recharts。
- 衍生指標（Net P&L、Win Rate、Profit Factor、Avg W/L、Max DD、equity curve、radar、calendar 聚合）放 `lib/metrics.ts` 純函式，元件只讀結果。

## i18n
- 所有顯示文案走 **react-i18next**（`en` / `zh-Hant`），**不得硬寫顯示字串**。
- 新增文案時**同時補 `en.json` 與 `zh-Hant.json`**，key 對齊。
- 數字、ticker 代號不翻譯；平台／帳戶 demo 名稱透過翻譯 map 切換。

## 型別與程式碼風格
- **TypeScript strict**；避免 `any`，共用型別放 `types/`。
- 函式元件 + hooks；元件用 **named export**。
- **每個元件一個資料夾**：`Component.tsx` + `Component.module.css`（必要時 `index.ts`）。
- popover / dropdown 用共用的 **outside-click hook** 統一「點外面關閉」；注意 A11y（鍵盤、focus、aria）。
- API 串接一律走 `lib/api` client，不在元件內散寫 `fetch`。

## Agent 檢查清單（每次修改前後自檢）
> 交付新畫面前，另跑一次 [`DESIGN_GUIDELINES.md`](DESIGN_GUIDELINES.md) 第 7 節「新增畫面檢查清單」。

- [ ] 新畫面沿用既有共用元件（Topbar / Card / Modal / SegmentedControl…），不重造。
- [ ] 顏色 / 間距 / 字型對照 design tokens 與 `tokens.css`，非憑印象調色。
- [ ] 新文案同時補 `en` / `zh-Hant`，無硬寫字串。
- [ ] 伺服器資料走 TanStack Query；UI/偏好狀態走 Zustand；兩者不混。
- [ ] 樣式用 CSS Modules + CSS 變數，無硬寫色碼、無 inline style 堆疊。
- [ ] 數字使用 IBM Plex Mono；沿用既有模式，未做無關重構。
