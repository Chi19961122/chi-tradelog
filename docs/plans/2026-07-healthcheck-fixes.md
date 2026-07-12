# 2026-07 健檢修正：日記假資料污染 + AutoMapper 授權

**狀態：進行中**

## Context

2026-07-12 外部健檢發現五項問題，經逐項驗證後裁決：兩項屬實且應於部署前修正（本計畫）、一項推翻（demo 登入實測正常：API 直呼與 UI 操作皆成功）、兩項降為上線後 polish（a11y/i18n 標籤、bundle 拆分）。

本計畫修正的兩項：

1. **日記假資料污染真實分析（高）**：`JournalEditor` 在無已存日記時以 `defaultJournalEntry(key, lang)` 產生確定性假情緒與預勾錯誤（原型時代遺留）。使用者只輸入筆記時，autosave 會把整包假資料寫入儲存（mock 與 API 模式皆然），污染 Emotion × Performance 與 Mistake Cost 分析。違反決策原則第 1 條「資料正確性 > UX 打磨 > 新功能」。
2. **AutoMapper 15 授權警告（中高）**：`AutoMapper 15.1.3` 為商業授權版本，Production 啟動噴無授權警告。作品集專案不留授權疑慮，降版至最後的 MIT 授權版 12.x。

## 修正設計

### 1. 日記空白起手

- `lib/journal.ts`：移除 `defaultEmotions` / `defaultMistakes` / `defaultJournalEntry`（及情緒池、seededRand 依賴），新增：
  - `standardMistakes(lang)`——標準六項錯誤清單、全部未勾（保留清單 UI 的打勾便利性；`checked:false` 不會被行為分析統計）
  - `emptyJournalEntry(lang)`——`notes:''`、`emotions:[]`、`mistakes: standardMistakes(lang)`
- `JournalEditor.tsx`：初始化改用 `emptyJournalEntry(lang)`。
- `journal.test.ts`：改測空白起手不變量——「新日記不得產生任何會被統計的內容」。
- 影響評估：行為分析（`behavior.ts`）只統計已儲存日記，不受影響；mock 日記存放區為記憶體空起手，demo 展示無回歸。

### 2. AutoMapper 降版 12.x

- 兩個 csproj：`15.1.3` → `12.0.1`；Api 專案補 `AutoMapper.Extensions.Microsoft.DependencyInjection 12.0.1`（v12 的 `AddAutoMapper` 在獨立套件）。
- `Program.cs`：`AddAutoMapper(_ => { }, assemblies)` → v12 簽章 `AddAutoMapper(assemblies)`。

## 驗證方式

- 前端：L1（tsc + eslint）→ L2（Vitest）→ L3（build）→ L4（mock 模式開新交易日記：無預選情緒、錯誤全未勾、輸入筆記後行為分析不出現未勾項目）
- 後端：L1（dotnet build，確認無授權警告）→ L2（dotnet test 44 綠）
