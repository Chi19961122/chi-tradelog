# DATABASE_SCHEMA — Chi.TradeLog

> 資料庫的**單一事實來源（single source of truth）**。動任何欄位 / 表 / schema 前先讀本檔；
> 每次新增或修改 **FluentMigrator migration** 時，**同步更新本檔**。不得自行猜測表名／欄位名。

## 基本慣例
- 資料庫：**PostgreSQL**。
- 命名：資料表與欄位一律 **`snake_case`**（複數表名，例：`trades`）。
- 主鍵：`id`（`bigint` / `bigserial` 或 `uuid`，建表時於本檔標明採用哪一種）。
- 時間欄位：`created_at`、`updated_at`（`timestamptz`）。
- schema 變更：只透過 **FluentMigrator**（`Chi.TradeLog.Repositories` 內的 migrations），不手動改 DB。

## 資料表（隨開發補充）
> 目前尚無 migration。建立第一個 migration 時，於此登錄各表的欄位、型別、約束與關聯。
> 預期首批資料表：

| 資料表 | 用途 | 狀態 |
| --- | --- | --- |
| `users` | 使用者與認證（JWT / BCrypt 雜湊密碼） | 待建立 |
| `platforms` | 交易平台 | 待建立 |
| `accounts` | 帳戶（屬於某 platform） | 待建立 |
| `trades` | 交易紀錄（day, sym, side, entry, exit, qty, r, pnl, tags） | 待建立 |
| `symbols` | 可選商品代號清單（feed 新增交易下拉） | 待建立 |
| `tags` | 策略標籤清單 | 待建立 |
| `journal_entries` | 每筆交易日誌（筆記／情緒／檢討／截圖） | 待建立 |

### 範本（新增資料表時複製此格式）
```
#### trades
| 欄位 | 型別 | 約束 | 說明 |
| --- | --- | --- | --- |
| id | bigserial | PK | |
| account_id | bigint | FK → accounts.id, NOT NULL | 所屬帳戶 |
| ... | ... | ... | ... |

關聯：trades.account_id → accounts.id（多對一）
索引：(account_id, day)
```

## 其他資料相關文件
本 `database/` 資料夾集中所有資料相關資產，例如：ERD 圖、seed 資料說明、匯入/匯出 CSV 欄位規格（`Date,Symbol,Side,Entry,Exit,Qty,PnL,R,Tags`）等，隨開發補充。
