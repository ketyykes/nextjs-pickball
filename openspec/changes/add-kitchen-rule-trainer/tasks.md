## 1. 基礎建置（型別與資料骨架）

- [ ] 1.1 建立目錄骨架：`mkdir -p app/play components/play lib/play data/play tests/e2e/specs`
- [ ] 1.2 新增 `lib/play/types.ts`：定義 `Point`、`GameStatus`、`GameState`、`GameAction`、`JudgeResult`、`Difficulty` 型別（型別檔，例外層；驗收：`pnpm tsc --noEmit` 通過）
- [ ] 1.3 新增 `data/play/ruleCards.ts`：以 `export const RULE_CARDS` 提供 Kitchen 規則繁體中文文案常數（純資料，例外層；驗收：`pnpm tsc --noEmit` 通過、檔案內無函式或 React 元件）
- [ ] 1.4 確認 commit「chore(play): scaffold kitchen rule trainer dirs and types」

## 2. data/play/difficulty 與 smoke test

> 行為邏輯：spec scenario「DEFAULT_DIFFICULTY 應含四個 number 欄位」

- [ ] 2.1 ① 紅燈：新增 `data/play/difficulty.test.ts`，加入 it 名稱「DEFAULT_DIFFICULTY 應含四個 number 欄位」的失敗測試；執行 `pnpm test -- --run data/play/difficulty.test.ts` 確認紅燈
- [ ] 2.2 ② 綠燈：新增 `data/play/difficulty.ts` 並 `export const DEFAULT_DIFFICULTY: Difficulty = { ballSpeed, toleranceRadius, kitchenLandingProbability, hitTimeoutMs }`；執行 `pnpm test -- --run data/play/difficulty.test.ts` 確認綠燈
- [ ] 2.3 ③ refactor：檢視實作；無壞味道時註記 skipped，否則重構並維持綠燈

## 3. lib/play/court — Kitchen 區域判定（行為邏輯，TDD）

> 對應 spec scenarios：「落點位於 Kitchen 區域內應回傳 true」、「落點位於 Kitchen 區域外應回傳 false」

- [ ] 3.1 ① 紅燈：新增 `lib/play/court.test.ts`，加入兩個 it（區域內回傳 true、區域外回傳 false）的失敗測試；定義並 export `COURT_BOUNDS`、`KITCHEN_BOUNDS` 預期值；`pnpm test -- --run lib/play/court.test.ts` 確認紅燈
- [ ] 3.2 ② 綠燈：新增 `lib/play/court.ts`，export `COURT_BOUNDS`（虛擬座標 600×900）、`KITCHEN_BOUNDS`、`isInKitchen(point)`；`pnpm test -- --run lib/play/court.test.ts` 綠燈
- [ ] 3.3 ③ refactor：檢視；註記 skipped 或重構並維持綠燈

## 4. lib/play/ball — 拋物線插值（行為邏輯，TDD）

> 對應 spec scenarios：「t=0 時應回傳起點且高度 0」、「t=1 時應回傳落點且高度 0」、「t=0.5 時應回傳線性中點且高度等於 peakHeight」

- [ ] 4.1 ① 紅燈：新增 `lib/play/ball.test.ts`，加入三個 it 的失敗測試；`pnpm test -- --run lib/play/ball.test.ts` 紅燈
- [ ] 4.2 ② 綠燈：新增 `lib/play/ball.ts`，export `interpolateBall(start, end, peakHeight, t)`，以 lerp 計算 (x, y) 並以 `4 * peakHeight * t * (1 - t)` 計算 height；`pnpm test -- --run lib/play/ball.test.ts` 綠燈
- [ ] 4.3 ③ refactor：檢視；註記 skipped 或重構

## 5. lib/play/judge — judgeHit 判定（行為邏輯，TDD，**最關鍵**）

> 對應 spec scenarios：「球落 Kitchen 內且玩家 volley 應判違規」、「球落 Kitchen 內且玩家等 bounce 應判合法」、「球落 Kitchen 外且玩家 volley 應判合法」、「球拍距落點超過容忍半徑應判 miss」

- [ ] 5.1 ① 紅燈：新增 `lib/play/judge.test.ts`，加入四個 judgeHit 相關 it 的失敗測試；`pnpm test -- --run lib/play/judge.test.ts` 紅燈
- [ ] 5.2 ② 綠燈：新增 `lib/play/judge.ts`，實作 `judgeHit(input)`：先判 miss（距離 > toleranceRadius）→ 再判 violation_kitchen（落點 in Kitchen 且 in_air）→ 否則 legal；`pnpm test -- --run lib/play/judge.test.ts` 綠燈
- [ ] 5.3 ③ refactor：檢視；註記 skipped 或重構

## 6. lib/play/judge — judgeTimeout（行為邏輯，TDD）

> 對應 spec scenario：「超過時限應視為 timeout」

- [ ] 6.1 ① 紅燈：在既有 `lib/play/judge.test.ts` 加入 it「超過時限應視為 timeout」的失敗測試；`pnpm test -- --run lib/play/judge.test.ts` 紅燈
- [ ] 6.2 ② 綠燈：在 `lib/play/judge.ts` 加入 `judgeTimeout(elapsedMs, timeoutMs)`；`pnpm test -- --run lib/play/judge.test.ts` 綠燈
- [ ] 6.3 ③ refactor：註記 skipped 或重構

## 7. lib/play/state — reducer 基本 transitions（行為邏輯，TDD）

> 對應 spec scenarios：「idle 收到 START 應重置分數並進入 serving」、「合法擊球應加分並累積連擊」、「連擊累積後合法擊球倍率正確」、「judging 狀態下應忽略額外的 PLAYER_HIT」

- [ ] 7.1 ① 紅燈：新增 `lib/play/state.test.ts`，加入四個 it 的失敗測試；定義 `initialState` import；`pnpm test -- --run lib/play/state.test.ts` 紅燈
- [ ] 7.2 ② 綠燈：新增 `lib/play/state.ts`，export `initialState` 與 `gameReducer(state, action)`；實作 START / PLAYER_HIT(legal) 加分與 combo 累積、judging 狀態下 PLAYER_HIT 為 no-op；`pnpm test -- --run lib/play/state.test.ts` 綠燈
- [ ] 7.3 ③ refactor：註記 skipped 或重構

## 8. lib/play/state — 違規／命數／重啟 transitions（行為邏輯，TDD）

> 對應 spec scenarios：「違規 Kitchen 應扣 1 命並重置連擊」、「命數歸零後應進入 game_over」、「game_over 收到 RESTART 應重置分數命數並進入 serving」

- [ ] 8.1 ① 紅燈：在 `lib/play/state.test.ts` 加入三個 it 的失敗測試；`pnpm test -- --run lib/play/state.test.ts` 紅燈
- [ ] 8.2 ② 綠燈：在 `gameReducer` 加入 PLAYER_HIT(violation_kitchen) 扣命邏輯、TIMEOUT 處理（含 lives 歸零進入 game_over）、RESTART 重置；`pnpm test -- --run lib/play/state.test.ts` 綠燈
- [ ] 8.3 ③ refactor：註記 skipped 或重構

## 9. hooks/useGameLoop — RAF 包裝（行為邏輯，TDD）

> 對應 spec scenarios：「啟用後應每 tick 呼叫 callback 並傳入 deltaMs」、「enabled 為 false 時不應啟動 RAF」、「卸載時應取消 RAF」

- [ ] 9.1 ① 紅燈：新增 `hooks/useGameLoop.test.ts`，使用 `renderHook` 與可控 `now` / `raf` / `cancel` mock 撰寫三個 it 的失敗測試；`pnpm test -- --run hooks/useGameLoop.test.ts` 紅燈
- [ ] 9.2 ② 綠燈：新增 `hooks/useGameLoop.ts`，以 `useEffect` 訂閱 RAF；`enabled === false` 時不啟動；卸載時呼叫 cancel；以注入時間源計算 deltaMs；`pnpm test -- --run hooks/useGameLoop.test.ts` 綠燈
- [ ] 9.3 ③ refactor：檢視 effect 與 closure；註記 skipped 或重構

## 10. components/play 呈現元件群（含 use client、Pointer Events、touch-action）

> 元件呈現層；行為邏輯部分由 lib/play 與 useGameLoop 涵蓋。逐檔提交，互動元件首行 `"use client"`。

- [ ] 10.1 新增 `components/play/HUD.tsx`：純呈現，props 為 `{ score, lives, combo }`，顯示分數 / 命數 / 連擊（驗收：`pnpm tsc --noEmit` 通過、與其他元件組合後可在 `/play` 看到 HUD）
- [ ] 10.2 新增 `components/play/StartScreen.tsx`（首行 `"use client"`）：含 `data-testid="play-start-button"` 的「開始」按鈕、1 句 Kitchen 規則教學（從 `data/play/ruleCards.ts` 取得）
- [ ] 10.3 新增 `components/play/RuleCard.tsx`（首行 `"use client"`）：props `{ visible, onClose }`；以 `data-testid="rule-card-kitchen"` 包裹；2 秒自動關閉以 `setTimeout` 在 effect 內處理
- [ ] 10.4 新增 `components/play/PauseOverlay.tsx`（首行 `"use client"`）：覆蓋層 + 繼續按鈕
- [ ] 10.5 新增 `components/play/GameOverModal.tsx`（首行 `"use client"`）：以 shadcn `Card` + `Button` 組合；含 `data-testid="game-over-modal"`、`<a href="/#kitchen">查看 Kitchen 規則詳細說明</a>`、`data-testid="restart-button"` 的再玩一次按鈕
- [ ] 10.6 新增 `components/play/GameCanvas.tsx`（首行 `"use client"`）：使用 `useReducer(gameReducer, initialState)` + `useGameLoop`；`onPointerDown` / `onPointerMove` / `onPointerUp` 處理輸入；容器套 `style={{ touchAction: 'none' }}`；`ResizeObserver` 觀察容器並重設 Canvas 尺寸與縮放；rAF 內以虛擬座標繪製球場、Kitchen 高亮、球拍、球（含視覺高度模擬）
- [ ] 10.7 commit「feat(play): add presentational components for kitchen rule trainer」

## 11. app/play 入口頁（例外層）

- [ ] 11.1 新增 `app/play/page.tsx`：純組合，預設 export 一個 client component 包裝（首行 `"use client"`），組合 StartScreen / GameCanvas / HUD / RuleCard / PauseOverlay / GameOverModal；`metadata` 設定（若用 layout）；驗收：`pnpm dev` 後造訪 `http://localhost:3000/play` 看到 StartScreen
- [ ] 11.2 commit「feat(play): wire up /play route」

## 12. 首頁 Hero 加入 `/play` 入口連結

> 對應 spec delta scenarios：「首頁 Hero 顯示 /play 入口連結」、「點擊 Hero 入口連結後可進入 /play 看到開始按鈕」（行為以 E2E 驗收，元件邊界調整視為入口層）

- [ ] 12.1 修改 `components/guide/Hero.tsx`：在主標題下方／統計區附近加入 `<Link href="/play" data-testid="hero-play-link">練習 Kitchen 規則</Link>`（或原生 `<a>`）；保持既有動畫節奏與 Tailwind utility 風格；驗收：手動於 `pnpm dev` 確認首頁可看到該連結，點擊後抵達 `/play`
- [ ] 12.2 commit「feat(guide): add /play entry link from hero」

## 13. tests/e2e/specs/play.spec.ts（E2E，例外層）

> 對應 spec scenarios：「進入 /play 顯示開始按鈕」、「點擊開始按鈕後 HUD 顯示初始分數與三條命」、「GameCanvas 容器套用 touch-action:none」、「行動裝置觸控可觸發擊球並改變 HUD」、「視窗縮小時 Canvas 仍完整顯示球場」、「違規後規則小卡可見」、「game over 後顯示結算 modal 與回首頁規則連結」、「首頁 Hero 顯示 /play 入口連結」、「點擊 Hero 入口連結後可進入 /play 看到開始按鈕」

- [ ] 13.1 確認本機 Playwright browsers 已安裝：執行 `pnpm exec playwright install`（一次性，跨 session 持久；CI 端若失敗請於 README/AGENTS.md 註記）
- [ ] 13.2 新增 `tests/e2e/specs/play.spec.ts`，撰寫上述 9 個 it 對應的 Playwright 測試；使用 `data-testid` 作為主要選擇器；至少 mobile 測試 1 個場景使用 `page.tap(...)` 驗證觸控
- [ ] 13.3 執行 `pnpm test:e2e --project=chromium tests/e2e/specs/play.spec.ts`，確認 chromium 通過
- [ ] 13.4 執行 `pnpm test:e2e tests/e2e/specs/play.spec.ts`（五個 browser project），確認全部通過；若 webkit / mobile project 因環境問題無法本機執行，於 commit message 註記哪幾個 project 已驗證，剩下交由 CI
- [ ] 13.5 commit「test(play): add first e2e spec covering /play and hero entry」

## 14. 套件審查與最終驗證

- [ ] 14.1 檢查 `package.json` 確認未新增 phaser / pixi.js / matter-js / three / @react-three 等遊戲引擎依賴；`pnpm install` 不出現新依賴
- [ ] 14.2 執行 `pnpm test`（Vitest 全套）→ 全綠
- [ ] 14.3 執行 `pnpm lint` → 零錯誤
- [ ] 14.4 執行 `pnpm build` → 成功；確認 `/play` route 出現於 build 輸出
- [ ] 14.5 手動 smoke：`pnpm dev` 後桌機 + Chrome DevTools mobile emulation 各玩一局，確認：開始 / 揮拍 / 違規時規則卡 / 結算 modal / 再玩一次 / 回首頁規則連結 全部正常
- [ ] 14.6 `openspec validate add-kitchen-rule-trainer --strict` 通過

## 15. 歸檔（合併入 main 後）

- [ ] 15.1 待主分支合併並驗收，執行 `openspec archive add-kitchen-rule-trainer` 將 change 移入 `openspec/changes/archive/`，並 sync delta specs 至 `openspec/specs/`
