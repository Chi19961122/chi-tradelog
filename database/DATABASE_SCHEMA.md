# DATABASE_SCHEMA — Chi.TradeLog

> 資料庫的**單一事實來源（single source of truth）**。動任何欄位 / 表 / schema 前先讀本檔；
> 每次新增或修改 **FluentMigrator migration** 時，**同步更新本檔**。不得自行猜測表名／欄位名。

## 基本慣例
- 資料庫：**PostgreSQL**。
- 命名：資料表與欄位一律 **`snake_case`**（複數表名，例：`trades`）。
- 主鍵：`id`（`bigint` / `bigserial` 或 `uuid`，建表時於本檔標明採用哪一種）。
- 時間欄位：`created_at`、`updated_at`（`timestamptz`）。
- schema 變更：只透過 **FluentMigrator**（`Chi.TradeLog.Repositories` 內的 migrations），不手動改 DB。

## 資料表

| 資料表 | 用途 | 狀態 |
| --- | --- | --- |
| `trades` | 交易紀錄 | ✅ 已建立（Migration 0001/0002） |
| `platforms` | 交易平台 | ✅ 已建立（Migration 0003/0004） |
| `accounts` | 帳戶（屬於某 platform） | ✅ 已建立（Migration 0003/0004） |
| `symbols` | 可選商品代號清單（feed 新增交易下拉） | ✅ 已建立（Migration 0003/0004） |
| `tags` | 策略標籤清單 | ✅ 已建立（Migration 0003/0004） |
| `app_settings` | 應用程式設定（初始資金等） | ✅ 已建立（Migration 0003/0004） |
| `journal_entries` | 每筆交易日誌（筆記／情緒／檢討） | ✅ 已建立（Migration 0005） |
| `users` | 使用者與認證（JWT / BCrypt 雜湊密碼） | ✅ 已建立（Migration 0006/0007） |

> **多租戶隔離（Migration 0008）**：除 `users` 外，上表所有資料表皆有
> `user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE`，
> 所有查詢／寫入一律以 user_id 為範圍；既有資料已回填給示範使用者（alex）。

### trades
由 `Migration0001_CreateTradesTable` 建立、`Migration0002_SeedTrades` 植入示範資料。

| 欄位 | 型別 | 約束 | 說明 |
| --- | --- | --- | --- |
| `id` | bigint | PK, identity | 交易主鍵 |
| `user_id` | bigint | NOT NULL, FK → users.id (CASCADE) | 資料所屬使用者（Migration 0008） |
| `account_id` | varchar(64) | NOT NULL | 所屬帳戶 ID（目前對應前端 `a1`/`a2`/`a3`；未來 FK → `accounts`） |
| `symbol` | varchar(32) | NOT NULL | 商品代號 |
| `side` | varchar(8) | NOT NULL | 方向：`Long` / `Short` |
| `entry_price` | numeric(18,4) | NOT NULL | 進場價 |
| `exit_price` | numeric(18,4) | NOT NULL | 出場價 |
| `quantity` | integer | NOT NULL | 數量 |
| `pnl` | numeric(18,2) | NOT NULL | 損益（美元） |
| `r_multiple` | numeric(10,2) | NOT NULL | R 倍數 |
| `traded_on` | date | NOT NULL | 交易日期 |
| `holding_minutes` | integer | NOT NULL | 持倉分鐘數 |
| `tags` | text[] | NOT NULL, default `{}` | 標籤陣列 |
| `stop_loss` | numeric(18,4) | NULL | 停損價（Migration 0012；有值時 R 以真實風險計算） |
| `charges` | numeric(18,2) | NULL | 手續費（Migration 0009；貼上匯入才有值） |
| `opened_at` | timestamptz | NULL | 進場時間（Migration 0009；貼上匯入才有值） |
| `closed_at` | timestamptz | NULL | 出場時間（Migration 0009；貼上匯入才有值） |
| `created_at` | timestamptz | NOT NULL, default now() | 建立時間 |
| `updated_at` | timestamptz | NOT NULL, default now() | 更新時間 |

索引：`ix_trades_user_account_traded_on` on (`user_id`, `account_id`, `traded_on` DESC)（Migration 0008 取代原 `ix_trades_account_traded_on`）

> 待辦：`account_id` 目前未設 FK → `accounts.id`（值已對齊 `a1`/`a2`/`a3`，之後可補外鍵）。

### platforms / accounts（Migration 0003/0004）
以字串 id 對齊前端（`p1`/`a1`…），與 `trades.account_id` 一致。

| 資料表.欄位 | 型別 | 約束 | 說明 |
| --- | --- | --- | --- |
| `platforms.user_id` | bigint | NOT NULL, FK → users.id (CASCADE) | 資料所屬使用者（Migration 0008） |
| `platforms.id` | varchar(64) | PK | 平台 id（如 `p1`） |
| `platforms.name` | varchar(128) | NOT NULL | 平台名稱 |
| `accounts.user_id` | bigint | NOT NULL, FK → users.id (CASCADE) | 資料所屬使用者（Migration 0008） |
| `accounts.id` | varchar(64) | PK | 帳戶 id（如 `a1`） |
| `accounts.platform_id` | varchar(64) | FK → platforms.id, ON DELETE CASCADE | 所屬平台 |
| `accounts.name` | varchar(128) | NOT NULL | 帳戶名稱 |

### symbols / tags / app_settings（Migration 0003/0004；0008 改為 per-user）
| 資料表.欄位 | 型別 | 約束 | 說明 |
| --- | --- | --- | --- |
| `symbols.(user_id, ticker)` | bigint, varchar(32) | 複合 PK（`pk_symbols`） | 每位使用者自有商品清單 |
| `tags.(user_id, name)` | bigint, varchar(64) | 複合 PK（`pk_tags`） | 每位使用者自有標籤清單 |
| `app_settings.user_id` | bigint | PK（`pk_app_settings`；原 `id` 欄已移除） | 每位使用者一列 |
| `app_settings.initial_capital` | numeric(18,2) | NOT NULL | 初始資金（無列時後端以 10000 為預設） |
| `app_settings.journal_template` | text | NULL | 日記範本（Migration 0011；未設定時前端用內建預設） |

### journal_entries（Migration 0005；0010 改完整日期）
以（`user_id`, `account_id`, `symbol`, `entry_date`）為唯一鍵；無 seed（前端在無資料時以確定性演算法產生預設情緒/檢討）。

| 欄位 | 型別 | 約束 | 說明 |
| --- | --- | --- | --- |
| `id` | bigint | PK, identity | |
| `user_id` | bigint | NOT NULL, FK → users.id (CASCADE) | 資料所屬使用者（Migration 0008） |
| `account_id` | varchar(64) | NOT NULL | 所屬帳戶 |
| `symbol` | varchar(32) | NOT NULL | 商品代號 |
| `entry_date` | date | NOT NULL | 日記日期（Migration 0010 取代原 `day` int；既有資料以 2026-07 回填） |
| `notes` | text | NOT NULL, default `''` | 筆記 HTML（含貼上截圖的 data URL） |
| `emotions` | text[] | NOT NULL, default `{}` | 情緒標籤 |
| `mistakes` | jsonb | NOT NULL, default `[]` | 錯誤檢討清單 `[{label,checked}]` |
| `updated_at` | timestamptz | NOT NULL, default now() | 更新時間 |

唯一鍵：`uq_journal_entry` (user_id, account_id, symbol, entry_date)

### users（Migration 0006/0007）
由 `Migration0006_CreateUsers` 建立並植入示範使用者（`alex@chitradelog.com` / `demo1234`，BCrypt 雜湊）；`Migration0007_AddUserIsAdmin` 加入 `is_admin` 並將示範使用者設為管理員。

| 欄位 | 型別 | 約束 | 說明 |
| --- | --- | --- | --- |
| `id` | bigint | PK, identity | 使用者主鍵 |
| `email` | varchar(256) | NOT NULL, UNIQUE | 電子郵件（登入帳號） |
| `password_hash` | varchar(256) | NOT NULL | BCrypt 密碼雜湊 |
| `display_name` | varchar(128) | NOT NULL | 顯示名稱 |
| `is_admin` | boolean | NOT NULL, default false | 是否為管理員（可管理使用者） |
| `created_at` | timestamptz | NOT NULL, default now() | 建立時間 |

## 其他資料相關文件
本 `database/` 資料夾集中所有資料相關資產，例如：ERD 圖、seed 資料說明、匯入/匯出 CSV 欄位規格（`Date,Symbol,Side,Entry,Exit,Qty,PnL,R,Tags`）等，隨開發補充。
