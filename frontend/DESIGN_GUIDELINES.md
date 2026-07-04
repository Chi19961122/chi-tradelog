# Chi.TradeLog — 設計規範

交易日記平台的視覺與版面基準。所有新增畫面、元件、調整都應依此規範執行，以維持一致的密度、色彩、間距與互動語彙。
**版本 1.0 · 2026-07-04**

> 本檔是視覺與版面的事實來源，與 [`CLAUDE.md`](CLAUDE.md)（前端工程規範）搭配使用。tokens 對應到 `src/styles/tokens.css` 的 CSS 變數。

---

## 1 · 設計原則
- **資料優先，克制裝飾。** 畫面服務於「快速判讀績效」。每個數字、圖示、色塊都要有意義；避免無用的 stat、漸層、emoji 與純裝飾元素。
- **留白建立層級。** 用間距與字重（而非分隔線與外框）區分區塊。卡片之間靠 `gap`，不靠 margin 疊加。
- **數字一律等寬字體。** 所有金額、比率、R 值、日期數字用 **IBM Plex Mono**，讓欄位對齊、易於掃描。
- **顏色只表達語意。** 綠=獲利、紅=虧損、紫=Trade Score / Short 標記、藍=Long 標記與次要連結。不要為了好看而新增色彩；需要中間色時用既有色的透明度疊加。
- **一次只改被要求的部分。** 小調整不重排版面、不動未提及的間距/字級/顏色。

---

## 2 · 色彩 Tokens
系統為雙主題。**預設為暗色。** 所有顏色只能取自下表 token（程式中的 `c.*` / CSS 變數），**不可硬寫新色值**。分頁與作用中狀態用 `navActive*`。

### 核心 Token
| Token | 用途 | Light | Dark（預設） |
| --- | --- | --- | --- |
| `bg` | 頁面底色 | `#FBFAF8` | `#0B0F0D` |
| `card` | 卡片 / 彈窗面 | `#FFFFFF` | `#121613` |
| `pillBg` | 膠囊 / 輸入框 / 次要面 | `#F1EFEA` | `#171C18` |
| `ink` | 主要文字 | `#14171A` | `#F2F4F1` |
| `sub` | 次要文字 | `rgba(20,23,26,.55)` | `rgba(242,244,241,.62)` |
| `faint` | 標籤 / 弱化文字 | `rgba(20,23,26,.38)` | `rgba(242,244,241,.42)` |
| `line` | 分隔線 / 邊框 | `rgba(20,23,26,.09)` | `rgba(255,255,255,.09)` |

### 語意色
| Token | 用途 | Light | Dark |
| --- | --- | --- | --- |
| `green` | 獲利 / 正值 / 開啟 | `#16A34A` | `#34D399` |
| `red` | 虧損 / 負值 / 刪除 | `#DC2626` | `#F87171` |
| `blue` | Long 標記 / 次要連結 | `#2A5FD6` | `#7AA2F7` |
| `purple` | Trade Score / Short 標記 | `#7C3AED` | `#A78BFA` |
| `navActiveBg` | 作用中分頁底 | `#16341F` | `#1F3A26` |
| `navActiveText` | 作用中分頁字 | `#FFFFFF` | `#EFFFF2` |

日曆與圖表的淡色填充用**語意色加透明度**（如獲利格 `rgba(green,.10~.32)`），不另建 token。
分數條固定為 `linear-gradient(90deg,#EF4444,#F59E0B,#22C55E)`。

---

## 3 · 字體
| 角色 | 字體 | 大小 / 字重 | 備註 |
| --- | --- | --- | --- |
| 頁面標題 | Inter | 20–22px / 800 | 每頁主標 |
| 卡片標題 | Inter | 13–14px / 700 | |
| 區塊 / 欄位標籤 | Inter | 10.5–11px / 700 | 大寫 + `letter-spacing:.3–.05em`，色 `faint` |
| 內文 / 表格 | Inter | 12.5–14.5px / 400–600 | |
| 所有數字 | IBM Plex Mono | 依情境 / 700 | 金額、比率、R、Entry/Exit、日期數字 |
| KPI 大數字 | IBM Plex Mono | 24–34px / 800 | |

---

## 4 · 間距、圓角、邊框
- **圓角**：膠囊 / 標籤 / 切換鈕 = `999px`；卡片 / 彈窗 = `14–18px`；輸入框 / 小色塊 = `8–10px`。
- **邊框**：卡片與輸入框一律 `1px solid line`；不用陰影分層，彈窗才用陰影（`0 24px 64px rgba(0,0,0,.3)`）。
- **內距**：主內容區 `32px 40px`；卡片 `18–24px`；膠囊群 `padding:4px` + 內鈕 `6–9px 12–16px`；輸入框 `11px 13px`。
- **版心**：內容置中，`max-width:1440px; margin:0 auto`。頂部列為滿版。**絕不可讓區塊漏出版心容器（會變滿版跑版）。**
- **排列**：一律用 flex / grid + `gap`，不用逐一 margin 或 inline 間隔。KPI 列用 `repeat(N,1fr)`，隱藏卡片會自動補滿。

---

## 5 · 元件規範
**分頁 / 切換膠囊（Segmented）**
外層 `pillBg` + `1px line` + `999px`，`padding:4px`；內鈕作用中 = `navActiveBg` / `navActiveText`，非作用中 = 透明 + `sub`。用於主導覽、篩選、快速區間、每頁筆數、Long/Short。

**KPI 卡片**
結構：大寫小標籤（`faint`）→ 等寬大數字 → 「▲/▼ x% vs last month」增減列（`green`/`red`）。勝率、平均賺賠比卡加綠/紅雙弧環（中間留小缺口）。可透過 Dashboard 的 Customize 開關顯示/隱藏；預設 Account Balance 關閉。

**膠囊標籤（可刪）**
Symbol / Tag / Emotion / Account chip：`pillBg` + `1px line` + `999px`，右側 × 刪除（`opacity:.6`）。新增用 `1px dashed line` 的輸入框，Enter 送出。

**彈窗（Modal）**
遮罩 `rgba(0,0,0,.45)` 置中；面板 `card` + radius `16–18px` + 陰影。表頭含標題與關閉 X（stroke icon）。表尾（Add/Edit Trade）底色用 `pillBg`，含刪除（紅，僅編輯）/ 取消 / 儲存。所有交易日記、日曆日詳情、新增/編輯交易皆為彈窗。

**下拉 / 彈出（Dropdown）**
觸發鈕含 chevron；面板為 `card` + `1px line` + radius `12px` + 陰影。**一律點擊外部關閉**（KPI 自訂、日期選擇、Symbol/Tag、帳戶切換、使用者選單）。

**圖示**
全部為 inline SVG，線條風格（`fill:none; stroke:currentColor; stroke-width:2–2.5`），約 11–16px。**不用 emoji、不用點陣圖示。**

---

## 6 · 互動與方向色慣例
- **方向徽章**：Long = 藍底藍字「L」，Short = 紫底紫字「S」。此徽章**依交易方向上色，不依盈虧**。
- **盈虧文字**：正值 `green`、負值 `red`，永遠等寬字體，正值帶「+」。
- **日曆**：週日開頭，第 8 欄為週統計；格子依當日盈虧以語意色淡色填充。
- **多帳戶**：切換器用核取方塊可多選，勾選的帳戶資料合併呈現；至少保留一個選取。
- **雙語**：介面文字全繁中或全英切換（預設英文），代號 / 數字不變；示範平台名以對照表翻譯。

---

## 7 · 新增畫面檢查清單
交付任何新畫面或調整前，逐項確認：

- [ ] 顏色全部取自 token，且明暗兩主題都正確。
- [ ] 數字用 IBM Plex Mono；盈虧用 green/red 且方向徽章依方向上色。
- [ ] 卡片 = `card` + `1px line` + 對應圓角；膠囊 / 切換用既有 segmented 樣式。
- [ ] 用 flex / grid + `gap` 排列；內容置於 `max-width:1440px` 版心內，未漏出容器。
- [ ] 新下拉 / 彈出支援點擊外部關閉，並帶 `data-dropdown-root`。
- [ ] 所有可見文字都有 EN / 繁中兩份字串。
- [ ] 圖示為線條 SVG；無 emoji、無多餘裝飾與 data slop。
