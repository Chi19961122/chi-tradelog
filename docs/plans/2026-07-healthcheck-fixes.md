# 2026-07 健檢修正：日記假資料污染 + AutoMapper 授權

**狀態：已完成**（項目 1 已修復並驗證至 L4；項目 2 經評估後決策為「接受警告」，見下）

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

### 2. AutoMapper 授權警告（決策紀錄：接受警告，勿降版）

原方案「降版 12.x（最後的 MIT 版）」實作時被事實否決：

- NuGet 稽核回報 12.0.1 落在 **GHSA-rvv3-g6hj-g44x**（遞迴 DoS，CVSS 7.5）受影響範圍；修補版本只有 15.1.1+ / 16.1.1+——Lucky Penny 未回頭修補免費舊版。
- 降版等於「用授權警告換高嚴重性安全警告」，不划算，已回復 15.1.3（已修補版）。

三選項評估後使用者決策（2026-07-12）：**接受授權警告**。

| 選項 | 評估 |
| --- | --- |
| 移除 AutoMapper 手寫映射（全案僅 20 個 CreateMap） | 一次工永久解決，但使用者選擇不做 |
| 申請 Lucky Penny 免費 community key | 需註冊＋年續，行政負擔 |
| **接受警告（採用）** | 15.1.3 功能正常且無安全弱點；警告僅為 log 噪音 |

若未來要復議，優先考慮「移除手寫」；**不要降版 12.x**（安全弱點無修補）。

## 驗證方式

- 前端：L1（tsc + eslint）→ L2（Vitest）→ L3（build）→ L4（mock 模式開新交易日記：無預選情緒、錯誤全未勾、輸入筆記後行為分析不出現未勾項目）
- 後端：L1（dotnet build，確認無授權警告）→ L2（dotnet test 44 綠）
