## ADDED Requirements

### Requirement: 路由 `/play` 渲染 Kitchen Rule Trainer 遊戲頁

系統 SHALL 在路由 `/play` 渲染 Canvas 小遊戲頁，包含開始畫面（StartScreen）、遊戲主畫面（GameCanvas + HUD）、暫停層、結算 modal 等元件。`/play` 為獨立 route，與首頁解耦。

#### Scenario: 訪問 /play 看到「開始」按鈕

- **GIVEN** 使用者開啟 `/play`
- **WHEN** 頁面載入完成
- **THEN** 畫面顯示 StartScreen，含一個可被 `data-testid="play-start-button"` 找到的「開始」按鈕，以及 1 句 Kitchen 規則教學提示
- **驗收**：`tests/e2e/specs/play.spec.ts`，it 名稱「進入 /play 顯示開始按鈕」

#### Scenario: 點擊開始按鈕後遊戲進入 serving 狀態

- **GIVEN** 使用者位於 `/play` 的 StartScreen
- **WHEN** 點擊「開始」按鈕
- **THEN** Canvas 主畫面顯示，HUD 出現「分數 0」、「❤❤❤」、「連擊 x0」；reducer state 進入 `serving`
- **驗收**：`tests/e2e/specs/play.spec.ts`，it 名稱「點擊開始按鈕後 HUD 顯示初始分數與三條命」

### Requirement: Kitchen 區域判定為純函式且可單元測試

系統 SHALL 在 `lib/play/court.ts` 提供純函式 `isInKitchen(point: Point): boolean`，依照固定虛擬座標系（球場虛擬尺寸 600×900）判定點是否落在 Kitchen 區域內（玩家側非揮擊區）。座標系與 Kitchen 邊界 SHALL 以具型別常數 export。

#### Scenario: 球落點位於 Kitchen 區域內回傳 true

- **GIVEN** 已 import `isInKitchen` 與 `KITCHEN_BOUNDS`
- **WHEN** 呼叫 `isInKitchen({ x: 300, y: 720 })`（位於玩家側 Kitchen 區域內的中央落點）
- **THEN** 回傳 `true`
- **驗收**：`lib/play/court.test.ts`，it 名稱「落點位於 Kitchen 區域內應回傳 true」

#### Scenario: 球落點位於 Kitchen 區域外回傳 false

- **GIVEN** 已 import `isInKitchen`
- **WHEN** 呼叫 `isInKitchen({ x: 300, y: 850 })`（位於玩家底線附近、Kitchen 外）
- **THEN** 回傳 `false`
- **驗收**：`lib/play/court.test.ts`，it 名稱「落點位於 Kitchen 區域外應回傳 false」

### Requirement: 球軌跡為拋物線參數化且純函式

系統 SHALL 在 `lib/play/ball.ts` 提供純函式 `interpolateBall(start: Point, end: Point, peakHeight: number, t: number): { x, y, height }`，給定起點、落點、最高弧高與時間進度 `t ∈ [0, 1]`，回傳當前 (x, y) 與視覺高度（用於陰影 / 縮放）。`t=0` 對應起點且高度 0；`t=1` 對應落點且高度 0；`t=0.5` 對應線性 lerp 中點且高度等於 peakHeight。

#### Scenario: t=0 時球位於起點且高度為 0

- **GIVEN** 已 import `interpolateBall`
- **WHEN** 呼叫 `interpolateBall({ x: 0, y: 0 }, { x: 600, y: 900 }, 200, 0)`
- **THEN** 回傳 `{ x: 0, y: 0, height: 0 }`
- **驗收**：`lib/play/ball.test.ts`，it 名稱「t=0 時應回傳起點且高度 0」

#### Scenario: t=1 時球位於落點且高度為 0

- **GIVEN** 已 import `interpolateBall`
- **WHEN** 呼叫 `interpolateBall({ x: 0, y: 0 }, { x: 600, y: 900 }, 200, 1)`
- **THEN** 回傳 `{ x: 600, y: 900, height: 0 }`
- **驗收**：`lib/play/ball.test.ts`，it 名稱「t=1 時應回傳落點且高度 0」

#### Scenario: t=0.5 時球位於線性中點且高度等於 peakHeight

- **GIVEN** 已 import `interpolateBall`
- **WHEN** 呼叫 `interpolateBall({ x: 0, y: 0 }, { x: 600, y: 900 }, 200, 0.5)`
- **THEN** 回傳 `{ x: 300, y: 450, height: 200 }`
- **驗收**：`lib/play/ball.test.ts`，it 名稱「t=0.5 時應回傳線性中點且高度等於 peakHeight」

### Requirement: 違規／合法／miss 判定為純函式且涵蓋 Kitchen 規則

系統 SHALL 在 `lib/play/judge.ts` 提供純函式 `judgeHit(input: { landingPoint: Point; ballState: 'in_air' | 'after_bounce'; paddlePoint: Point; toleranceRadius: number }): JudgeResult`，依下列規則回傳 `{ kind: 'legal' } | { kind: 'violation_kitchen' } | { kind: 'miss' }`：

- 球拍與落點距離 > toleranceRadius：`miss`
- 落點在 Kitchen 內 且 球狀態為 `in_air`（玩家 volley）：`violation_kitchen`
- 落點在 Kitchen 內 且 球狀態為 `after_bounce`：`legal`
- 落點在 Kitchen 外（無論 in_air 或 after_bounce）：`legal`

系統 SHALL 在 `lib/play/judge.ts` 同時提供 `judgeTimeout(elapsedMs: number, timeoutMs: number): boolean`，於超過 timeoutMs 時回傳 true（視為 miss）。

#### Scenario: 球落 Kitchen 內且玩家 volley 應判違規

- **GIVEN** 已 import `judgeHit`
- **WHEN** 呼叫 `judgeHit({ landingPoint: { x: 300, y: 720 }, ballState: 'in_air', paddlePoint: { x: 305, y: 720 }, toleranceRadius: 40 })`
- **THEN** 回傳 `{ kind: 'violation_kitchen' }`
- **驗收**：`lib/play/judge.test.ts`，it 名稱「球落 Kitchen 內且玩家 volley 應判違規」

#### Scenario: 球落 Kitchen 內且玩家等 bounce 應判合法

- **GIVEN** 已 import `judgeHit`
- **WHEN** 呼叫 `judgeHit({ landingPoint: { x: 300, y: 720 }, ballState: 'after_bounce', paddlePoint: { x: 305, y: 720 }, toleranceRadius: 40 })`
- **THEN** 回傳 `{ kind: 'legal' }`
- **驗收**：`lib/play/judge.test.ts`，it 名稱「球落 Kitchen 內且玩家等 bounce 應判合法」

#### Scenario: 球落 Kitchen 外且玩家 volley 應判合法

- **GIVEN** 已 import `judgeHit`
- **WHEN** 呼叫 `judgeHit({ landingPoint: { x: 300, y: 850 }, ballState: 'in_air', paddlePoint: { x: 305, y: 850 }, toleranceRadius: 40 })`
- **THEN** 回傳 `{ kind: 'legal' }`
- **驗收**：`lib/play/judge.test.ts`，it 名稱「球落 Kitchen 外且玩家 volley 應判合法」

#### Scenario: 球拍距落點超過容忍半徑應判 miss

- **GIVEN** 已 import `judgeHit`
- **WHEN** 呼叫 `judgeHit({ landingPoint: { x: 300, y: 720 }, ballState: 'after_bounce', paddlePoint: { x: 500, y: 720 }, toleranceRadius: 40 })`
- **THEN** 回傳 `{ kind: 'miss' }`
- **驗收**：`lib/play/judge.test.ts`，it 名稱「球拍距落點超過容忍半徑應判 miss」

#### Scenario: 超過時限視為 timeout（miss）

- **GIVEN** 已 import `judgeTimeout`
- **WHEN** 呼叫 `judgeTimeout(3500, 3000)`
- **THEN** 回傳 `true`
- **驗收**：`lib/play/judge.test.ts`，it 名稱「超過時限應視為 timeout」

### Requirement: 遊戲狀態 reducer 為純函式且涵蓋所有 transitions

系統 SHALL 在 `lib/play/state.ts` 提供純函式 reducer `gameReducer(state: GameState, action: GameAction): GameState`，狀態包含：`status: 'idle' | 'serving' | 'incoming' | 'awaiting_input' | 'judging' | 'next_ball' | 'game_over'`、`score: number`、`lives: number`、`combo: number`、`lastResult: 'legal' | 'violation_kitchen' | 'miss' | null`。Actions 包含 `START`, `BALL_LANDED`, `PLAYER_HIT`, `TIMEOUT`, `RESTART`, `PAUSE`, `RESUME`。

合法擊球 SHALL 加 `10 * (combo + 1)` 分並 combo +1；違規 / miss SHALL 扣 1 命且 combo 歸 0；lives 為 0 時 status 進入 `game_over`。

#### Scenario: idle 收到 START 進入 serving 並重置分數命數

- **GIVEN** 已 import `gameReducer` 與 `initialState`
- **WHEN** 呼叫 `gameReducer(initialState, { type: 'START' })`
- **THEN** 回傳的 state 為 `{ status: 'serving', score: 0, lives: 3, combo: 0, lastResult: null }`
- **驗收**：`lib/play/state.test.ts`，it 名稱「idle 收到 START 應重置分數並進入 serving」

#### Scenario: 合法擊球加分並累積連擊

- **GIVEN** state 為 `{ status: 'awaiting_input', score: 0, lives: 3, combo: 0, lastResult: null }`
- **WHEN** dispatch `{ type: 'PLAYER_HIT', result: { kind: 'legal' } }`
- **THEN** 回傳的 state 為 `{ status: 'next_ball', score: 10, lives: 3, combo: 1, lastResult: 'legal' }`
- **驗收**：`lib/play/state.test.ts`，it 名稱「合法擊球應加分並累積連擊」

#### Scenario: 連擊 3 次後合法擊球分數倍率為 4

- **GIVEN** state 為 `{ status: 'awaiting_input', score: 60, lives: 3, combo: 3, lastResult: 'legal' }`
- **WHEN** dispatch `{ type: 'PLAYER_HIT', result: { kind: 'legal' } }`
- **THEN** 回傳的 state.score 為 `60 + 10 * 4 = 100`、combo 為 4
- **驗收**：`lib/play/state.test.ts`，it 名稱「連擊累積後合法擊球倍率正確」

#### Scenario: 違規 Kitchen 扣 1 命並重置連擊

- **GIVEN** state 為 `{ status: 'awaiting_input', score: 30, lives: 3, combo: 2, lastResult: 'legal' }`
- **WHEN** dispatch `{ type: 'PLAYER_HIT', result: { kind: 'violation_kitchen' } }`
- **THEN** 回傳的 state 為 `{ status: 'next_ball', score: 30, lives: 2, combo: 0, lastResult: 'violation_kitchen' }`
- **驗收**：`lib/play/state.test.ts`，it 名稱「違規 Kitchen 應扣 1 命並重置連擊」

#### Scenario: 命數歸零進入 game_over

- **GIVEN** state 為 `{ status: 'awaiting_input', score: 50, lives: 1, combo: 0, lastResult: null }`
- **WHEN** dispatch `{ type: 'TIMEOUT' }`
- **THEN** 回傳的 state.status 為 `'game_over'`、lives 為 `0`
- **驗收**：`lib/play/state.test.ts`，it 名稱「命數歸零後應進入 game_over」

#### Scenario: game_over 收到 RESTART 回到 serving 並重置分數命數

- **GIVEN** state 為 `{ status: 'game_over', score: 50, lives: 0, combo: 0, lastResult: 'miss' }`
- **WHEN** dispatch `{ type: 'RESTART' }`
- **THEN** 回傳的 state 為 `{ status: 'serving', score: 0, lives: 3, combo: 0, lastResult: null }`
- **驗收**：`lib/play/state.test.ts`，it 名稱「game_over 收到 RESTART 應重置分數命數並進入 serving」

#### Scenario: judging 狀態下忽略額外的 PLAYER_HIT

- **GIVEN** state 為 `{ status: 'judging', score: 0, lives: 3, combo: 0, lastResult: null }`
- **WHEN** dispatch `{ type: 'PLAYER_HIT', result: { kind: 'legal' } }`
- **THEN** 回傳的 state 與輸入完全相同（reducer 為 no-op）
- **驗收**：`lib/play/state.test.ts`，it 名稱「judging 狀態下應忽略額外的 PLAYER_HIT」

### Requirement: useGameLoop 為以 deltaTime 驅動的 RAF 包裝且可注入時間源

系統 SHALL 在 `hooks/useGameLoop.ts` 提供 hook `useGameLoop(callback: (deltaMs: number) => void, options?: { now?: () => number; raf?: (cb: FrameRequestCallback) => number; cancel?: (id: number) => void; enabled?: boolean }): void`，每個 RAF tick 以「上一 tick 至本 tick」的 deltaMs 呼叫 callback。`enabled === false` 時 SHALL 不啟動 RAF 迴圈；元件卸載時 SHALL 取消 RAF。`now` / `raf` / `cancel` 可注入以利測試。

#### Scenario: 啟用後每 tick 呼叫 callback 並傳入 deltaMs

- **GIVEN** 已注入可控 `raf` 與 `now`，並以 `renderHook` 啟動 `useGameLoop(callback, { enabled: true, now, raf, cancel })`
- **WHEN** 模擬連續兩次 RAF（兩次間隔 16ms）
- **THEN** callback 被呼叫至少一次，且至少一次的 deltaMs 為 16
- **驗收**：`hooks/useGameLoop.test.ts`，it 名稱「啟用後應每 tick 呼叫 callback 並傳入 deltaMs」

#### Scenario: enabled 為 false 時不啟動 RAF 迴圈

- **GIVEN** 已注入可控 `raf`
- **WHEN** 以 `renderHook` 啟動 `useGameLoop(callback, { enabled: false, now, raf, cancel })`
- **THEN** 注入的 `raf` 從未被呼叫
- **驗收**：`hooks/useGameLoop.test.ts`，it 名稱「enabled 為 false 時不應啟動 RAF」

#### Scenario: 元件卸載時取消 RAF

- **GIVEN** 已注入可控 `raf` 與 `cancel`，並以 `renderHook` 啟動 `useGameLoop(callback, { enabled: true, now, raf, cancel })`
- **WHEN** 呼叫 `unmount()`
- **THEN** 注入的 `cancel` 至少被呼叫一次
- **驗收**：`hooks/useGameLoop.test.ts`，it 名稱「卸載時應取消 RAF」

### Requirement: 操作以 Pointer Events 統一處理滑鼠與觸控

系統 SHALL 在 `components/play/GameCanvas.tsx` 以 `onPointerDown` / `onPointerMove` / `onPointerUp` 處理輸入；Canvas 容器 SHALL 套用 `touch-action: none`，避免 iOS Safari 雙擊縮放與被動事件警告。

#### Scenario: GameCanvas 容器套用 touch-action:none

- **GIVEN** 使用者進入遊戲主畫面
- **WHEN** 渲染 GameCanvas 容器
- **THEN** 容器根元素的 inline style 或 className 等價達成 `touch-action: none`
- **驗收**：`tests/e2e/specs/play.spec.ts`，it 名稱「GameCanvas 容器套用 touch-action:none」

#### Scenario: 行動裝置觸控可觸發擊球

- **GIVEN** 使用者於 Mobile Chrome / Mobile Safari project 進入 `/play` 並開始遊戲
- **WHEN** 在 Canvas 區域以觸控 tap 一次
- **THEN** HUD 顯示的分數或命數至少有一項在後續 1 秒內變動（代表 reducer 收到 PLAYER_HIT 或 TIMEOUT）
- **驗收**：`tests/e2e/specs/play.spec.ts`，it 名稱「行動裝置觸控可觸發擊球並改變 HUD」

### Requirement: Canvas 響應式以虛擬座標 + 縮放實作

系統 SHALL 以固定虛擬座標系（600×900）儲存所有幾何計算；`components/play/GameCanvas.tsx` SHALL 透過 `ResizeObserver` 觀察容器尺寸，並在 resize 後重設 Canvas backing store 與縮放比例。所有 reducer 與 lib/play 純函式 SHALL NOT 處理 device pixel ratio 或視窗尺寸。

#### Scenario: 視窗縮小時 Canvas 仍保持球場顯示

- **GIVEN** 使用者於 `/play` 進行遊戲
- **WHEN** 視窗寬度縮小至 360px
- **THEN** Canvas 元素的 client width 等於容器 width，球場仍完整顯示（球場 4 條邊與 Kitchen 邊界皆可見）
- **驗收**：`tests/e2e/specs/play.spec.ts`，it 名稱「視窗縮小時 Canvas 仍完整顯示球場」

### Requirement: 違規時跳出規則小卡並於 2 秒後自動關閉

系統 SHALL 在 reducer state.lastResult 為 `violation_kitchen` 時透過 `components/play/RuleCard.tsx` 顯示 Kitchen 規則小卡；2 秒後 SHALL 自動關閉並進入 `next_ball`。卡片內容 SHALL 從 `data/play/ruleCards.ts` 取得，至少包含一段以繁體中文（台灣用語）描述的 Kitchen 規則。

#### Scenario: 玩家違規後規則小卡可見

- **GIVEN** 使用者進行遊戲
- **WHEN** 玩家造成 Kitchen 違規（reducer state.lastResult = 'violation_kitchen'）
- **THEN** 畫面顯示 `data-testid="rule-card-kitchen"` 元素，內含 Kitchen 規則文案
- **驗收**：`tests/e2e/specs/play.spec.ts`，it 名稱「違規後規則小卡可見」

### Requirement: 結算 modal 顯示總分並提供回首頁規則連結

系統 SHALL 在 reducer state.status 為 `game_over` 時透過 `components/play/GameOverModal.tsx`（以 shadcn `Card` + `Button` 組成）顯示總分、最高連擊、「再玩一次」按鈕，以及一個連結 `<a href="/#kitchen">查看 Kitchen 規則詳細說明</a>`。

#### Scenario: game_over 後顯示結算 modal 與回首頁規則連結

- **GIVEN** 玩家三條命用盡，reducer state.status = 'game_over'
- **WHEN** 渲染 GameOverModal
- **THEN** 畫面顯示 `data-testid="game-over-modal"` 元素，內含 `<a>` 元素 `href="/#kitchen"` 與「再玩一次」按鈕（`data-testid="restart-button"`）
- **驗收**：`tests/e2e/specs/play.spec.ts`，it 名稱「game over 後顯示結算 modal 與回首頁規則連結」

### Requirement: 規則卡與難度資料以 named export 提供

系統 SHALL 在 `data/play/ruleCards.ts`、`data/play/difficulty.ts` 以 named export 提供具型別標註的常數；資料檔不含任何邏輯函式或 React 元件。`difficulty.ts` SHALL 至少 export `DEFAULT_DIFFICULTY` 常數，含 `ballSpeed`、`toleranceRadius`、`kitchenLandingProbability`、`hitTimeoutMs` 四個欄位。

#### Scenario: difficulty 模組提供具型別 DEFAULT_DIFFICULTY 常數

- **GIVEN** 已 import `DEFAULT_DIFFICULTY` 與型別 `Difficulty`
- **WHEN** 讀取 `DEFAULT_DIFFICULTY`
- **THEN** 為符合 `Difficulty` 型別的物件，含 `ballSpeed`、`toleranceRadius`、`kitchenLandingProbability`、`hitTimeoutMs` 四欄位且型別皆為 `number`
- **驗收**：`data/play/difficulty.test.ts`，it 名稱「DEFAULT_DIFFICULTY 應含四個 number 欄位」

### Requirement: 拆檔結構符合 lib / hooks / components / data 四層

系統 SHALL 將實作拆成下列檔案結構：

- `app/play/page.tsx`：純組合，不含資料宣告或行為邏輯
- `lib/play/`：5 個檔（`court.ts`、`ball.ts`、`judge.ts`、`state.ts`、`types.ts`），其中 `court.ts` / `ball.ts` / `judge.ts` / `state.ts` 各有 `.test.ts`
- `hooks/useGameLoop.ts` + `useGameLoop.test.ts`
- `components/play/`：6 個元件檔（`GameCanvas.tsx`、`HUD.tsx`、`RuleCard.tsx`、`GameOverModal.tsx`、`PauseOverlay.tsx`、`StartScreen.tsx`），互動元件首行 `"use client"`
- `data/play/`：2 個資料檔（`ruleCards.ts`、`difficulty.ts`）

#### Scenario: lib/play 含五個模組與四個測試檔

- **GIVEN** 完成實作
- **WHEN** 列出 `lib/play/` 下的 `.ts` 檔
- **THEN** 恰好存在 `court.ts`、`ball.ts`、`judge.ts`、`state.ts`、`types.ts`，且 `court.test.ts`、`ball.test.ts`、`judge.test.ts`、`state.test.ts` 皆存在

#### Scenario: components/play 頂層含六個元件檔且互動元件首行為 "use client"

- **GIVEN** 完成實作
- **WHEN** 列出 `components/play/` 下的 `.tsx` 檔
- **THEN** 恰好存在 `GameCanvas.tsx`、`HUD.tsx`、`RuleCard.tsx`、`GameOverModal.tsx`、`PauseOverlay.tsx`、`StartScreen.tsx` 共 6 個檔；其中至少 `GameCanvas.tsx`、`StartScreen.tsx`、`GameOverModal.tsx`、`PauseOverlay.tsx`、`RuleCard.tsx` 五者首行為 `"use client"`

### Requirement: 不引入完整 2D / 3D 遊戲框架

系統 SHALL NOT 在 `package.json` 新增 `phaser`、`pixi.js`、`pixi.js-legacy`、`@pixi/*`、`three`、`@react-three/*` 等完整 2D / 3D 遊戲渲染框架。
系統 MAY 引入輕量 2D 物理引擎（如 `matter-js`）以提供更真實的球體運動（重力、彈跳、阻尼），渲染仍以原生 Canvas 進行。

#### Scenario: package.json 不含完整遊戲框架

- **GIVEN** 完成實作
- **WHEN** 檢查 `package.json` 的 `dependencies` 與 `devDependencies`
- **THEN** 不存在 `phaser`、`pixi.js`、`@pixi/*`、`three`、`@react-three/*` 任何一項；`matter-js` 視物理需要可存在
