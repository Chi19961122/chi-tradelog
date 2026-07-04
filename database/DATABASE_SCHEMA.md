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
| `users` | 使用者與認證（JWT / BCrypt 雜湊密碼） | 待建立 |
| `platforms` | 交易平台 | 待建立 |
| `accounts` | 帳戶（屬於某 platform） | 待建立 |
| `symbols` | 可選商品代號清單（feed 新增交易下拉） | 待建立 |
| `tags` | 策略標籤清單 | 待建立 |
| `journal_entries` | 每筆交易日誌（筆記／情緒／檢討／截圖） | 待建立 |

### trades
由 `Migration0001_CreateTradesTable` 建立、`Migration0002_SeedTrades` 植入示範資料。

| 欄位 | 型別 | 約束 | 說明 |
| --- | --- | --- | --- |
| `id` | bigint | PK, identity | 交易主鍵 |
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
| `created_at` | timestamptz | NOT NULL, default now() | 建立時間 |
| `updated_at` | timestamptz | NOT NULL, default now() | 更新時間 |

索引：`ix_trades_account_traded_on` on (`account_id` ASC, `traded_on` DESC)

> 待辦：`account_id` 之後改為 FK → `accounts.id`（`accounts`/`platforms` 建立後）。

## 其他資料相關文件
本 `database/` 資料夾集中所有資料相關資產，例如：ERD 圖、seed 資料說明、匯入/匯出 CSV 欄位規格（`Date,Symbol,Side,Entry,Exit,Qty,PnL,R,Tags`）等，隨開發補充。
