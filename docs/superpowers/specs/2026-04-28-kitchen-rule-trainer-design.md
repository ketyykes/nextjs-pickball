# Kitchen Rule Trainer — Design Spec

- 日期：2026-04-28
- 狀態：Draft（待 review）
- 路由：`/play`

## Context

本專案目前是純內容型的匹克球指南（`/`，由 Hero / TocBar / Part 01-02 / Conclusion 組成）。
使用者希望新增一個**獨立、可實際操作**的小遊戲頁面，讓讀者除了「讀規則」之外還能「練規則」。

選定主題：**Kitchen（Non-Volley Zone）規則訓練**。理由：

- Kitchen 是匹克球最特殊、初學者最常違反的規則
- 球場上有實體區域，視覺化容易、判定明確
- 直接呼應首頁 Part 01/02 的規則章節，與既有內容形成「教 → 練」閉環
- 操作簡單（點擊／拖曳），手機觸控天然合適

決定**不安裝遊戲引擎**（Phaser/PixiJS/Matter.js），改採純 Canvas + React。理由見下方〈技術選型〉。

## Goals

- 30 秒內可上手的 mini-game，使用者能在 1 局內理解 Kitchen 規則
- 純 client-side、無後端依賴、可部署為 Next.js 靜態 route
- 桌機（滑鼠）+ 手機（觸控）皆可玩，直式／橫式皆能運作
- 與既有元件庫（shadcn/ui、Tailwind v4）一致的視覺
- 行為邏輯模組可單元測試（符合 OpenSpec spec-driven TDD）

## Non-Goals（v1 不做）

- 多關卡（Two-bounce rule、發球斜線練習等）
- 排行榜、雲端儲存進度
- 多人連線
- 背景音樂 / 音效（可在 v2 評估）
- 真實物理引擎、3D
- 多語系（沿用主站繁體中文）

## User Experience

### 進入

從首頁 TocBar 或 Hero 加上「練習 Kitchen 規則」入口連結到 `/play`。
（首頁本次只加一個按鈕連結，不改其他結構。）

### 流程

```
landing → tap "開始" → 教學提示 (1 句) → 第一球發出 → 玩家點擊球拍位置
  → 判定（合法 / 違規 / miss）→ 違規時跳出規則小卡 → 下一球
  → 失去 3 條命 → 結算 modal（總分、最高連擊、再玩一次）
```

### 主要畫面元素

- **Canvas 球場**：俯視單邊半場，玩家在底線、AI 在上方
- **HUD**：左上「分數」、右上「命數 ❤❤❤」、中上「連擊 x3」
- **右上角**：暫停 / 規則速查
- **底部 mobile**：操作提示「點擊／拖曳球拍位置」

### 操作

- **滑鼠**：移動 = 球拍跟隨；點擊 = 揮拍
- **觸控**：手指拖曳 = 球拍跟隨；放開 = 揮拍
- 統一以 Pointer Events 處理

### 判定規則（核心教學內容）

設球的落點為 P，玩家擊球時球的狀態為 S：

| 落點 P | 玩家擊球時 S | 結果 |
|---|---|---|
| Kitchen 內 | volley（球未落地） | **違規**（Kitchen Rule） |
| Kitchen 內 | groundstroke（球已落地一次） | **合法** +分 |
| Kitchen 外 | volley | **合法** +分 |
| Kitchen 外 | groundstroke | **合法** +分 |
| 任何位置 | 球拍距落點 > 容忍半徑 | **miss** −1 命 |
| 超過時限未擊球 | — | **miss** −1 命 |

違規時跳出規則小卡，2 秒後自動關閉，扣 1 命，連擊歸零。

## Architecture

### 路由與檔案佈局

```
app/play/
  page.tsx                  # /play 進入點（"use client" 包裝 GameCanvas）
  layout.tsx                # （可選）給 /play 自己的 metadata

components/play/
  GameCanvas.tsx            # 主畫面：Canvas + Pointer 事件 + RAF 串接
  HUD.tsx                   # 分數、命數、連擊顯示（純 React）
  RuleCard.tsx              # 違規時跳出的規則卡
  GameOverModal.tsx         # 結算 modal（用 shadcn Card / Button）
  PauseOverlay.tsx          # 暫停層
  StartScreen.tsx           # 進入時的「開始」畫面 + 教學

hooks/
  useGameLoop.ts            # RAF wrapper（可注入時間源以利測試）
  useGameLoop.test.ts

lib/play/
  court.ts                  # 球場座標、Kitchen 區域定義（純函式）
  court.test.ts
  ball.ts                   # 拋物線插值、落點計算（純函式）
  ball.test.ts
  judge.ts                  # 違規 / miss 判定（純函式，最關鍵的測試重點）
  judge.test.ts
  state.ts                  # 遊戲狀態 reducer
  state.test.ts
  types.ts                  # 共用型別

data/play/
  ruleCards.ts              # 規則小卡文案（Kitchen rule 解說）
  difficulty.ts             # 難度參數（球速、容忍半徑、Kitchen 落點機率）
```

### 為什麼這樣切

每個 `lib/play/*.ts` 都是**純函式 + 可獨立單元測試**，符合專案 OpenSpec spec-driven TDD 要求。

- `judge.ts` 是教學正確性的命脈 → 一定要有完整測試
- `court.ts`、`ball.ts` 是幾何計算 → 純函式好測
- `state.ts` 是 reducer，把所有副作用隔離在 hook 與 component 層

`GameCanvas.tsx` 只負責：訂閱 RAF、把 state 渲染到 Canvas、把 Pointer 事件轉成 reducer action。**不放任何規則邏輯**。

### 狀態機

```
idle → serving → incoming → (player_input | timeout)
  → judging → (scored | violation | miss)
  → next_ball | game_over
```

reducer 接收 actions：`START`, `BALL_LANDED`, `PLAYER_HIT(point, time)`, `TIMEOUT`, `RESTART`, `PAUSE`, `RESUME`。

### 球軌跡（不需要物理引擎）

球從 AI 起點 `A` 拋向落點 `P`，使用**拋物線參數化**：

- 輸入：起點 A、落點 P、總飛行時間 T、最高弧高 H
- 在 RAF loop 中以 `t/T ∈ [0,1]` 插值：
  - x, y（俯視 2D）線性 lerp
  - 視覺上的「高度」用 `4*H*t*(1-t)` 模擬拋物線陰影 / 縮放（球落地前看起來是浮空的）
- 落地後彈一次（高度衰減 0.4×、再次插值）以實作 groundstroke 情境

不需要重力、空氣阻力、真實彈跳係數。

### Canvas 響應式

- 球場使用**虛擬座標系**（例如 0~1 normalized 或固定 600×900）
- 渲染前依視窗大小換算為 device pixel
- `ResizeObserver` 觀察 container，視窗變化時重繪
- 直式（窄視窗）：球場縱向；橫式（寬視窗）：球場橫向（v1 可只支援縱向，橫向放 v1.1）

### 視覺風格

- 配色沿用 `app/globals.css` 已有的 OKLCH semantic colors
- 球場：草綠或藍底，Kitchen 區用半透明高亮
- 球拍 / 球：圓形 / 圓角矩形，純色塊即可（v1 不放擬真貼圖）
- 規則小卡、結算 modal：用 shadcn Card + Button

## 技術選型

### 為什麼不裝遊戲引擎

| 引擎 | 評估 |
|---|---|
| Phaser 3 | 功能完整但 bundle +200KB、學習曲線；本案複雜度用不到 |
| PixiJS | 純渲染，要自己加狀態與物理，等於還是要寫一半 |
| Matter.js | 純物理，但本案沒有真實物理需求（拋物線參數化即可） |
| **純 Canvas + React** | **0 額外 bundle、純函式好測、與現有 stack 一致** |

### 額外可能引入的小工具（v1 不一定加）

- `clsx` / `tailwind-merge`：已有（`lib/utils.ts` 的 `cn()`）
- `@react-spring/web` 或 `framer-motion`：UI 動畫（非 Canvas）— **暫不加**，先用 CSS transition

## Error Handling / Edge Cases

- **使用者快速連點**：reducer 在 `judging` 狀態時忽略 `PLAYER_HIT`
- **視窗縮放中**：暫停 RAF 直到 resize 結束（debounce 100ms）
- **離開分頁**：`document.visibilitychange` 觸發自動暫停
- **iOS Safari 觸控延遲**：使用 Pointer Events + `touch-action: none` 避免雙擊縮放
- **低效能裝置 RAF 掉幀**：以 deltaTime 驅動插值（不假設固定 60fps）

## Testing Strategy

依專案 CLAUDE.md 的 OpenSpec spec-driven TDD：行為邏輯先寫失敗測試 → 實作至 green → refactor。

### 單元測試（Vitest，鄰近原始碼）

- `lib/play/judge.test.ts`（**最重要**）：完整覆蓋上方判定表的所有情境
- `lib/play/court.test.ts`：點是否在 Kitchen 內、半場邊界
- `lib/play/ball.test.ts`：拋物線插值在 t=0/0.5/1 的座標
- `lib/play/state.test.ts`：reducer 各 action 的 transitions
- `hooks/useGameLoop.test.ts`：以 fake RAF / 控制時間源驗證 tick

### E2E（Playwright，`tests/e2e/specs/play.spec.ts`）

- Smoke：`/play` 載入、看到「開始」按鈕
- 互動：點擊「開始」、第一球出現、能 hit Canvas 區域、HUD 數字會變
- 五個 browser project（含 Mobile Chrome / Mobile Safari）都需通過 → 自動驗證行動裝置可玩

### 不需 TDD 的檔案（依 CLAUDE.md 例外清單）

- `app/play/page.tsx`、`app/play/layout.tsx`（入口）
- `data/play/*.ts`（純資料）
- `components/play/*.tsx` 的純呈現部分（但若含分支邏輯仍需測試）

## 如何驗證（end-to-end）

1. `pnpm dev` → 開 `http://localhost:3000/play`
2. 桌機：滑鼠移動、點擊；確認球拍跟隨、擊球判定、HUD 更新、規則小卡跳出、結算 modal 顯示
3. 手機：用 Chrome DevTools mobile emulation 或實機開啟，確認觸控正常、無雙擊縮放、視窗旋轉不會破版
4. `pnpm test -- --run lib/play hooks/useGameLoop` → 所有單元測試通過
5. `pnpm test:e2e -- play.spec` → 五個 browser project 通過
6. `pnpm lint`、`pnpm build` 通過

## 決定（已 review）

1. **入口**：首頁 Hero 加一個明顯的「練習 Kitchen 規則」按鈕，連到 `/play`
2. **音效**：v1 全程 mute，不處理 audio autoplay policy
3. **結算後**：提供「回首頁查看 Kitchen 規則」連結，錨點到首頁對應段落
4. **佈局**：v1 只支援縱向（portrait）；橫式留到 v1.1

## 後續延伸（v2+，僅備忘）

- Two-bounce rule 練習關卡
- 發球斜線練習關卡
- 簡單的 daily challenge / 連勝統計（localStorage）
- 音效 + 背景音樂
- 排行榜（需後端）
