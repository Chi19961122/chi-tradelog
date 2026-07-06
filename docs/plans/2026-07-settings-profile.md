# 2026-07 Settings 排版優化 + 個人檔案

> 狀態：**規劃中（已設計、未實作）** ｜ 分支：`feature/系統優化調整`
> 交接備註：需求已確認、關鍵設計已定案（見下），程式碼**尚未動工**。接手者照本檔實作即可。

## Context
使用者需求：(1) Settings 頁重新排版優化；(2) 新增「個人檔案」——使用者自行修改顯示名稱與 email。
目前只有 admin 能改別人的資料（`PUT /api/users/{id}`），本人無自助入口。

## 已定案的關鍵設計

### 個人檔案後端：`PUT /api/auth/profile`
- 放 `AuthController`（比照 `PUT /api/auth/password` 的模式：`[Authorize]`、由 email claim 識別本人）。
- **關鍵**：email 是 JWT claim 與 refresh 的身分鍵（見 ENGINEERING_SYSTEM.md 2.4）。
  改 email 後舊 token 立即過時 → **成功時必須回傳新的 AuthViewModel（token + user）**，
  流程：`UserService.UpdateOwnProfileAsync` 成功 → `_authService.RefreshAsync(新email)` → 回 200 + AuthViewModel。
- `UserService.UpdateOwnProfileAsync(currentEmail, name, newEmail)`：
  依 email 取使用者（null → NotFound）→ 新 email 正規化小寫、與他人重複 → EmailConflict →
  `UpdateProfileAsync(id, newEmail, name, user.IsAdmin)`（**IsAdmin 沿用原值，本人不得自改權限**）→ Ok。
  回傳沿用 `UserMutationResult`。
- 新 `UpdateProfileParameter { Name, Email }` + validator（NotEmpty + EmailAddress）；
  Controller 對應：Ok→200(AuthViewModel)、NotFound→404、EmailConflict→409 ProblemDetails「電子郵件已被使用」。
- xUnit：conflict、ok（確認 IsAdmin 未被改動、email 正規化）。

### 個人檔案前端
- `authStore` 加 `updateProfile(name, email): Promise<'ok'|'conflict'|'error'>`：
  - API 模式：PUT `/api/auth/profile` → 409 回 'conflict'；200 取回 `{token, user}` →
    `persist(token, user, isRemembered())` + setState（與 refresh 相同的儲存區沿用邏輯）。
  - mock 模式：直接 `persist(null, {name, email...}, isRemembered())` + setState 回 'ok'。
- `ProfileSection` 元件（放 `AccountSecuritySections.tsx` 同檔或獨立）：名稱、email 輸入 + 儲存，
  成功/衝突訊息比照 `ChangePasswordSection` 的 ok/err 樣式。**mock 模式也顯示**（本地可用），
  Password/Users 維持 API-only gate。
- i18n（en + zh-Hant 同步）：`settings.profileTitle/profileSubtitle/profileName/profileEmail/saveProfile/profileSaved`。

### Settings 排版
- `Settings.module.css` 的 `.page` 改雙欄 grid：`grid-template-columns: 1fr 1fr; gap: 18px;`
  寬卡 `grid-column: 1 / -1`；`@media (max-width: 900px)` 退回單欄。
- 卡片順序與跨欄：
  1. Profile ｜ Password（API；mock 時 Profile 旁為 Account）
  2. Account（初始資金）
  3. Platforms & Accounts（**全寬**）
  4. Symbols ｜ Tags
  5. Users（**全寬**，API + admin）
- 奇數張時允許半寬空位（常見版式，不硬湊）。頁面加 `max-width` 提升寬螢幕可讀性（建議 ~960px）。

## 驗證（照 ENGINEERING_SYSTEM.md 1.2）
- 後端測試 + docker：改名 204/200 帶新 token；改 email 撞他人 → 409；改 email 後用**新 token** refresh 成功。
- 瀏覽器（API）：Settings 改名 → Topbar 顯示新名字；改 email → 登出再用新 email 登入成功；
  舊 email 登入失敗。
- 瀏覽器（mock）：Profile 區塊可改名並即時反映；Password/Users 仍隱藏。
- 排版：桌面雙欄如規格、900px 以下單欄、既有功能（平台改名、chips）不受影響。

## 已完成的前置調查
- `AuthController` 結構已讀：建構式已注入 `IUserService`/`IAuthService`/`IMapper`，
  email claim 讀法 `User.FindFirstValue(JwtRegisteredClaimNames.Email)`（比照 ChangePasswordAsync）。
- `UserRepository.UpdateProfileAsync(id, email, displayName, isAdmin)` 已存在（Phase 4 加的），直接重用。
