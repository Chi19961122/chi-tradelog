# Handoff: Chi.TradeLog — Trader's Trading Journal

## Overview
Chi.TradeLog is a trader's journaling / analytics web app (inspired conceptually by trade-journal tools). It lets a user review performance across accounts, log & edit trades, review a P&L calendar, analyze performance, and keep per-trade journals with notes/screenshots. The prototype supports light/dark themes, EN / 繁體中文 language toggle, multi-platform / multi-account switching, CSV import/export, and a mock login flow.

## About the Design Files
The file in this bundle (`Trading Journal.dc.html`) is a **design reference created in HTML** — a working prototype showing the intended look, layout, and behavior. It is **not** production code to copy directly. It is built as a single "Design Component" (a streaming HTML file with an embedded `class Component` logic block and `{{ }}` template holes) specific to our design tool.

The task is to **recreate these designs in the target codebase's environment** (e.g. React + your component library, Vue, etc.) using its established patterns — routing, state management, styling system, data layer. If no environment exists yet, choose an appropriate stack (React + TypeScript + a charting lib like Recharts/visx is a natural fit) and implement there. Do not ship the `.dc.html` file directly.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, iconography, and interactions are all specified. Recreate the UI closely, but swap the bespoke SVG charts and hand-rolled controls for your codebase's charting library and design-system components where equivalent.

## Global Shell

### Topbar (fixed, full width)
- 3-column CSS grid: `minmax(0,1fr) auto minmax(0,1fr)`, `align-items:center`, padding `22px 40px`, bottom border `1px` divider.
- **Left**: wordmark **"Chi.TradeLog"** (800 weight) + an **account switcher pill** (shows `Platform · Account`, chevron; opens a dropdown of platforms→accounts with **checkboxes** for multi-select; "Manage Platforms" link at bottom → Settings). Left column must be `min-width:0; overflow:hidden` and the switcher label `white-space:nowrap; max-width:140px; text-overflow:ellipsis` so it never overlaps the centered nav.
- **Center**: nav pill group (segmented control): Dashboard · Trade Log · Calendar · Reports · Settings. Active item filled with `navActiveBg`.
- **Right**: language toggle (中文 / EN), theme toggle (sun/moon icon), user avatar (initials) → dropdown with name/email, Account Settings, Log Out.
- Main content sits in a `max-width:1440px; margin:0 auto; padding:32px 40px` column. (Bug to avoid: don't let any section leave this container or it renders full-bleed.)

### Auth
- Logged-out state shows a centered **login card** (360px): wordmark, subtitle, Email + Password fields, a **Remember me** checkbox, "Log In" button. Prototype accepts any credentials.

## Screens / Views

### 1. Dashboard ("Overview")
- Header row: title "Overview" + subtitle ("Last 30 days · Jul 2026"); right-aligned **Customize** button (gear) → popover with toggle switches to show/hide each KPI card.
- **KPI row**: CSS grid, columns = number of *visible* cards (`repeat(N,1fr)`) so hidden cards reflow to fill. Cards: **Net P&L**, **Win Rate**, **Profit Factor**, **Avg Win/Loss**, **Max Drawdown**, **Account Balance** (Balance hidden by default). Each card: uppercase label, big mono value, and a "▲/▼ x% vs last month" delta line.
  - Win Rate & Avg Win/Loss cards include a small green/red **donut ring** (two arcs with a small gap) showing the ratio; Avg W/L also shows `$avgWin / $avgLoss`.
- **Equity Curve** card (left, ~1.5fr): area+line chart of cumulative P&L. Y-axis $ labels in a left gutter (outside the plot), X-axis date labels below. Hover shows a vertical guide + tooltip (date · value); click-drag selects a range and shows the range's P&L delta. Range pills: All / This Month / This Quarter / This Year.
- **Trade Score** card (right, ~1fr): 6-axis **radar/hexagon** (Win Rate, Profit Factor, Consistency, Max DD, Avg W/L, Recovery) with purple fill; labels center-anchored just outside each vertex; hover tooltips per node; big score number + short red→amber→green gradient bar, centered.
- **Calendar** block: month grid, week starts **Sunday**, 8th column = weekly stat (P&L + win%). Cells tinted green/red by daily P&L; each shows day #, P&L, "win% · trades". Clicking a day opens the day-detail modal.
- **Recent Trades** list: side badge (L=blue / S=purple, by direction not P&L), symbol, R, P&L (green/red).

### 2. Trade Log
- Header: title + **+ Add Trade** primary button.
- Toolbar row: an Import/Export segmented group (Import CSV | Export CSV) + a "Download sample" text link (downloads a template CSV).
- Filters row: side segmented (All/Long/Short); tag filter pills + quick "+add tag" input; a custom **date-range picker** (button → calendar popover with prev/next month, click-click range select, purple selected days, Cancel/Done); quick-range pills (Today/This Week/This Month/This Quarter).
- Table: columns Date, Symbol, Side, Entry, Exit, Qty, P&L, R, Tags, + edit-icon column. Row click opens the **Journal modal** for that trade; the pencil icon opens the **Edit Trade modal**.
- Pagination footer: "Showing X–Y of Z", per-page pills (10/20/50, default 20), prev/next.
- **Add/Edit Trade modal**: header + close X; fields Symbol (custom dropdown from Settings symbol list), Side (segmented), Entry, Exit, Qty, Day, Tag (custom dropdown from Settings tag list); footer with Delete (edit mode only) + Cancel + Save.

### 3. Calendar
- Full-page month calendar (same structure as dashboard block) with prev/next **month navigation** and month label. Sunday-first, weekly-stat 8th column.
- **Day detail modal**: date + weekday header; win-rate donut + Net P&L / Win Rate / Trades summary; list of that day's trades (side badge, symbol, side·qty, entry→exit, R, P&L). If the day has real trades, a trade row click jumps to that trade's Journal.

### 4. Reports
- KPI row (same 6 metrics).
- Charts: **Win Rate by Weekday** (bars), **P&L by Symbol** (green/red bars), **R-Multiple Distribution** (histogram), **Holding Time Distribution** (buckets <15m/15-60m/1-4h/4-8h/1d+ with avg holding time), **Monthly Performance** (6-month P&L bars, green/red), and a **Strategy Tag Performance** table (Tag · Trades · Win Rate · Avg P&L).

### 5. Journal (modal, opened from a Trade Log row)
- Header (Journal) + close. Trade summary (date as title, symbol·side, P&L). Entry/Exit/Qty/R stat tiles.
- **Tags** chips, **Emotions** chips (add/remove), **Mistake Review** checklist (toggle check, add/remove items).
- **Notes** rich-text-ish editor: toolbar (Apply Template / Set Template / Clear · Bold/Italic/Underline · font-size −/+) + a `contentEditable` area with **paste-image** support (pasted screenshots embed inline). "Saved / Editing…" status indicator.

### 6. Settings
- **Account**: Initial Capital input ($).
- **Platforms & Accounts**: list of platforms (removable) each with its accounts (chips, removable) + "add account" input; "+ add platform" input.
- **Symbols**: chip list, add/remove.
- **Tags**: chip list, add/remove. (These symbol/tag lists feed the Add-Trade dropdowns.)

## Interactions & Behavior
- Tab switch via nav pills (client-side, no reload).
- All dropdowns/popovers (KPI customize, date picker, symbol/tag dropdowns, account switcher, user menu) close on outside click.
- Multi-account: selecting multiple accounts merges their trades across all views; "Add Trade" writes to the first selected account.
- CSV import parses `Date,Symbol,Side,Entry,Exit,Qty,PnL,R,Tags`; new symbols/tags auto-added to lists.
- Language toggle swaps all UI copy EN↔繁中 (including default platform/account demo names via a small translation map); numbers/tickers stay as-is.
- Theme toggle light↔dark (default **dark**, default language **English**).

## State Management
Key state: `tab`, `lang`, `theme`, `loggedOut` + login form fields, `platforms[]` (+accounts), `activeAccountIds[]`, `tradesByAccount{}` (per-account trade arrays, seeded lazily), trade filters (`tradeFilter`, `tagFilter`, `dateFrom/dateTo`), pagination (`tlPage`, `tlPageSize`), modal flags (`tradeModalOpen`, `journalModalOpen`, `dayDetailOpen`) + their target ids, journal per-entry maps (`notesByEntry`, `customEmotions`, `customMistakes`) keyed by `accountId-symbol-day`, KPI visibility map, equity-curve range/hover/selection, `symbolsList`, `tagsList`, `initialCapital`. In a real app, back trades with an API and persist journal notes/screenshots server-side.

## Design Tokens
Dark (default): bg `#0B0F0D`, card `#121613`, pill `#171C18`, ink `#F2F4F1`, sub `rgba(242,244,241,.62)`, faint `rgba(242,244,241,.42)`, line `rgba(255,255,255,.09)`, green `#34D399`, red `#F87171`, blue `#7AA2F7`, purple `#A78BFA`, navActiveBg `#1F3A26`, navActiveText `#EFFFF2`.
Light: bg `#FBFAF8`, card `#FFFFFF`, pill `#F1EFEA`, ink `#14171A`, sub `rgba(20,23,26,.55)`, faint `rgba(20,23,26,.38)`, line `rgba(20,23,26,.09)`, green `#16A34A`, red `#DC2626`, blue `#2A5FD6`, purple `#7C3AED`, navActiveBg `#16341F`, navActiveText `#FFFFFF`.
Score gradient bar: `linear-gradient(90deg,#EF4444,#F59E0B,#22C55E)`.
Type: **Inter** (UI, 400–800) + **IBM Plex Mono** (all numbers/values). Radii: pills 999px, cards 14–18px, inputs 8–10px. Card border: 1px `line`.

## Assets
No external images — all icons are inline SVG (stroke style, ~13–16px). Charts are hand-drawn SVG; replace with a charting library. Fonts from Google Fonts (Inter, IBM Plex Mono).

## Files
- `Trading Journal.dc.html` — the full prototype (template markup + `class Component` logic with all data/handlers). Read this for exact copy, computed values, and interaction logic.
