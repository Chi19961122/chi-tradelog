# CLAUDE.md — Chi.TradeLog 後端規範

> 本檔定義 `backend/` 的架構、技術、命名與程式碼風格。根目錄總覽見 [`../CLAUDE.md`](../CLAUDE.md)。

## 專案是什麼
`Chi.TradeLog.Api` 是 **ASP.NET Core Web API（.NET 10 LTS，Controller-based）**，提供交易日記相關資料的**查詢與維護**能力（trades、accounts/platforms、symbols、tags、journal、auth）。

採**分層架構（Layered Architecture）**：
- **Api（Controllers）**：API 層。Controllers、Filters、DI、Swagger、JWT 設定。
- **Services**：業務邏輯層。處理運算與決策（KPI／衍生指標）。
- **Repositories**：資料存取層。以 **Dapper + Npgsql** 連 PostgreSQL；FluentMigrator migrations。
- **Common**：共用 Model / Enum / Extensions / Options（設定物件）。

## 技術棧 Tech Stack
- **ASP.NET Core / .NET 10 LTS**，Controller-based Web API。
- **PostgreSQL + Npgsql + Dapper**（**非 EF 為主**）。
- **FluentMigrator**：所有 schema 變更一律走 migration，不手動改 DB。
- **FluentValidation**：搭配自訂 `ParameterValidatorAttribute` 做參數驗證。
- **AutoMapper**：層與層之間的物件轉換（見下方資料流的 mapping 方向）。
- **JWT Bearer Authentication + BCrypt**（密碼雜湊）。
- **Swagger / OpenAPI**：API 文件（含 XML 註解）。
- **統一例外處理**（middleware）。
- **測試**：xUnit + FluentAssertions + WebApplicationFactory。
- **部署**：Docker / Docker Compose。

## 分層責任與資料流
每一層有專屬資料模型，**不得跨層混用**，避免資料模型外洩：

```
Client ──Parameter──▶ Controller
                        │  Parameter ─▶ InfoModel
                        ▼
                     Service  ──Condition──▶ Repository ──▶ PostgreSQL
                        ▲                        │
                        │◀─────── DataModel ◀─────┘
                     Service ─▶ Dto
                        │
Controller ◀── Dto ─────┘
   │  Dto ─▶ ViewModel
   ▼
Client ◀── ViewModel
```

- **Controller**
  - 用 **Parameter** 物件接收輸入（Request）。
  - 將 Parameter 轉成 **InfoModel** 傳給 Service。
  - 收 Service 回傳的 **Dto**，轉成 **ViewModel** 回應。
  - 只處理輸入輸出與 HTTP 關注點；**不寫業務邏輯、不直接碰 SQL**。
- **Service**
  - 業務邏輯、運算與決策（交易衍生指標可在此或 `Common` 的純函式）。
  - 呼叫 Repository 前，把 InfoModel 轉成 **Condition**。
  - 回傳 **Dto**。
- **Repository**
  - 只做資料存取（Dapper / Npgsql）。
  - 接 **Condition**，回傳 **DataModel**（對應資料表結構）。
  - **不寫業務邏輯。**
- **Common**
  - 共用 Model / Enum / Extensions / Options。

> 物件轉換一律用 **AutoMapper**，於 Profile 設定 mapping。慣用方向：
> `Parameter → InfoModel`、`InfoModel → Condition`、`DataModel → Dto`、`Dto → ViewModel`。

## 語言規範
- **回應語言**：繁體中文。
- **程式碼註解**：繁體中文（XML 文件註解 `/// <summary>`）。
- **命名**：英文（PascalCase / camelCase）。
- **英文技術詞**：保留原文並附中文說明。

## 程式碼風格
規範衝突時優先序：**本檔 > 本專案既有風格 > 通用 C#/.NET 慣例**。本檔以「目標規範」為主；既有程式碼未收斂不代表新程式碼可延續舊寫法，但**不為了格式一致做無關重構**。

### 一般原則
- 遵循 **SOLID**。
- 優先 **async/await** 非同步；型別明顯時用 `var`。

### 現代語法與效能（.NET 10 / 新版 C#）
- **禁止同步封鎖非同步**：不用 `.Result` / `.Wait()`，一律 `await` 串接。非同步方法以 `Async` 結尾。
- **避免多次列舉與多餘中間集合**：能用 `Any()` 就不用 `Count() > 0`；能一次迭代完成就不重複 LINQ。
- 優先較新語法提升可讀性：`is null` / `is not null`、pattern matching、switch expression、目標型別 `new()`（不降低清晰度前提下）。
- 以 **`is false`** 取代 `!` 表達否定，較易閱讀。
- **資源釋放**：`using var` / `await using`。
- **HTTP**：用 `IHttpClientFactory` / DI 注入的 `HttpClient`，**不自行 `new HttpClient()`**。
- **JSON**：優先 **System.Text.Json**；不新增 Newtonsoft.Json 用法。

### 註解與宣告慣例（本專案，優先於通用慣例）
- **XML `<summary>` 一律用三行格式**（即使內容只有一行），不寫成單行：
  ```csharp
  /// <summary>
  /// 交易查詢請求參數（Parameter）。
  /// </summary>
  ```
- **不使用 `sealed`**：類別宣告不加 `sealed` 修飾詞。
- **使用明確建構式（explicit constructor）注入相依**：欄位以 `_camelCase` 命名（`private readonly`）；**不使用 primary constructor**（即不寫 `class Foo(IBar bar)`）。

## 資料庫規則
- **動任何欄位 / 表 / schema 前，先讀 [`../database/DATABASE_SCHEMA.md`](../database/DATABASE_SCHEMA.md)**。所有資料相關文件集中在 repo 根目錄的 `database/` 資料夾。
- **不得自行猜測表名／欄位名**（這類錯誤編譯不一定抓得到，執行才壞）。
- 所有 schema 變更走 **FluentMigrator migration**（程式碼在 `Chi.TradeLog.Repositories`），並**同步更新 `database/DATABASE_SCHEMA.md`**，不手動改資料庫。
- PostgreSQL 慣例：資料表與欄位用 `snake_case`；Dapper 對應到 C# PascalCase 屬性時明確處理命名。

## Agent 檢查清單（每次修改前後自檢）
- [ ] 遵守分層：Controller 不含業務邏輯、Repository 不含業務邏輯、無跨層模型混用。
- [ ] 新增／修改 API：補 **XML 註解**、**Swagger 註解**、對應 **FluentValidation Validator**。
- [ ] 動 schema：先讀「資料庫 Schema」段落，新增對應 **FluentMigrator migration** 並更新該段落。
- [ ] 補 **xUnit 測試**（必要時 WebApplicationFactory 整合測試）。
- [ ] async 全程 `await`，無 `.Result` / `.Wait()`；無不必要多次列舉。
- [ ] 沿用既有模式，未做無關重構。
