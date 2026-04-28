## Why

目前站內為純內容型的匹克球指南（`/`），讀者讀完規則後沒有立刻動手練習的機會。匹克球最特殊、初學者最常違反的「Kitchen（Non-Volley Zone）規則」具備明確區域與判定條件，非常適合做成 mini-game 讓讀者在站內直接「練規則」，與既有 Part 01/02 的「教規則」段落形成「教 → 練」閉環。

## What Changes

- 新增獨立路由 `/play`，承載 Canvas 小遊戲「Kitchen Rule Trainer」
  - 俯視單邊半場、AI 從上方發球、玩家以 Pointer Events（滑鼠／觸控）控制球拍位置接球
  - 依據球落點（Kitchen 內／外）與玩家擊球時球狀態（volley／groundstroke）判定合法／違規／miss
  - 命數 3、連擊倍數加分；違規時顯示規則小卡（2 秒）；3 條命用完顯示結算 modal
  - v1：mute、portrait only、無排行榜、無 localStorage
- 新增純函式行為邏輯模組 `lib/play/{court,ball,judge,state,types}.ts`，全 TDD
- 新增 `hooks/useGameLoop.ts`（RAF 包裝，可注入時間源以利測試）
- 新增 `components/play/*` 呈現元件群（GameCanvas / HUD / RuleCard / GameOverModal / PauseOverlay / StartScreen）
- 新增 `data/play/{ruleCards,difficulty}.ts` 純資料檔
- 新增 Playwright E2E spec `tests/e2e/specs/play.spec.ts`（站內首個 e2e spec），以五個 browser project（含 Mobile Chrome / Mobile Safari）自動驗證手機可玩
- 修改 `components/guide/Hero.tsx`：新增「練習 Kitchen 規則」按鈕連到 `/play`
- 不引入遊戲引擎（Phaser/PixiJS/Matter.js），純 Canvas + React

## Capabilities

### New Capabilities

- `kitchen-rule-trainer`：`/play` 路由的 Canvas 小遊戲；含 Kitchen 規則判定、球軌跡插值、遊戲狀態機、命數／連擊／結算流程、規則小卡

### Modified Capabilities

- `pickleball-guide-page`：Hero 區新增一個 CTA 按鈕，連結到 `/play`，作為從「教規則」進入「練規則」的入口

## Impact

- **新增程式碼**：`app/play/`、`components/play/`、`lib/play/`、`data/play/`、`hooks/useGameLoop.{ts,test.ts}`、`tests/e2e/specs/play.spec.ts`
- **修改程式碼**：`components/guide/Hero.tsx`（追加入口按鈕）
- **依賴**：不新增 npm 套件
- **bundle 影響**：`/play` route 為 client component；首頁僅多一個按鈕，影響可忽略
- **CI**：首次啟用 Playwright E2E（既有 `pnpm test:e2e` 指令但無 spec），需確認 CI 環境已具備 Playwright browsers
- **既有規格**：`openspec/specs/pickleball-guide-page/` 需透過 delta 增加「Hero 提供 `/play` 入口連結」的需求
