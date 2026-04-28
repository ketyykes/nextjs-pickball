## Context

主站既有 Pickleball Guide（`/`）為純內容型單頁，由 Hero / TocBar / Part 01-02 / Conclusion 組成。本變更新增獨立路由 `/play`，承載一個 Canvas mini-game「Kitchen Rule Trainer」，與既有指南共存（不影響首頁結構，僅在 Hero 加入口按鈕）。

技術棧為 Next.js 16 App Router + React 19 + TS（strict、`verbatimModuleSyntax: true`）+ Tailwind v4 + shadcn/ui。測試工具：Vitest + happy-dom（單元）、Playwright（E2E，五個 browser project）。

詳細視覺與玩法描述見 `docs/superpowers/specs/2026-04-28-kitchen-rule-trainer-design.md`（brainstorming 階段產出，本 design.md 聚焦於工程決策）。

## Goals / Non-Goals

**Goals:**

- 在站內提供「邊讀規則邊練規則」的閉環，重點教 Kitchen 規則
- `/play` 為獨立 client route，可獨立部署、獨立測試
- 行為邏輯模組（規則判定、球軌跡、狀態機）為**純函式**，符合本專案 OpenSpec spec-driven TDD 要求
- 桌機（滑鼠）與手機（觸控）皆可玩；五個 Playwright browser project 自動驗證手機可玩性
- 零新增 npm 套件

**Non-Goals（v1）:**

- 多關卡（Two-bounce rule、發球斜線練習）
- 排行榜、雲端儲存、localStorage 進度
- 多人連線
- 音效 / BGM
- 真實物理引擎、3D
- 橫式佈局（v1 僅 portrait；橫式延後 v1.1）
- 多語系（沿用站內繁體中文）

## Decisions

### D1：不引入遊戲引擎，純 Canvas + React

- **選擇**：純 `<canvas>` + React（用 `useGameLoop` 包 RAF）+ Pointer Events
- **替代**：
  - Phaser 3 — 功能完整但 bundle +200KB、學習曲線；本案複雜度用不到
  - PixiJS — 純渲染需自己加狀態與物理，等於一半工作量
  - Matter.js — 純物理但本案不需要真實彈跳
- **理由**：球軌跡可拋物線參數化、區域判定純向量比較、狀態機規模小；引擎是 overkill 且增加 bundle 與認知成本

### D2：行為邏輯抽到 `lib/play/` 純函式，元件層只負責呈現

- 拆分：`court.ts`（球場座標 / Kitchen 區域判定）、`ball.ts`（拋物線插值）、`judge.ts`（合法／違規／miss 判定，**最關鍵**）、`state.ts`（reducer）、`types.ts`（共用型別）
- `GameCanvas.tsx` 只負責：訂閱 RAF、把 state 渲染到 Canvas、把 Pointer 事件轉成 reducer action
- **理由**：純函式好測（happy-dom 不需要 Canvas API）、reducer transitions 可獨立驗證；違規判定是教學正確性的命脈，必須有完整覆蓋
- **TDD 強度**：`lib/play/*.ts` + `hooks/useGameLoop.ts` **必須 TDD**（OpenSpec config 規範）

### D3：球軌跡用拋物線參數化，不用真實物理

- 輸入：起點 A、落點 P、總飛行時間 T、最高弧高 H
- RAF loop 中以 `t/T ∈ [0,1]` 插值；x, y 線性 lerp，視覺高度用 `4*H*t*(1-t)` 模擬拋物線
- 落地後彈一次（高度衰減 0.4×、再插值）以實作 groundstroke 情境
- **理由**：本遊戲只需要「球從 A 到 B 並合理彈跳」，不需要重力 / 阻力 / 真實彈跳係數；參數化插值資料量小、純函式可單元測試

### D4：Pointer Events 而非 Mouse / Touch 雙寫

- 統一使用 `onPointerDown` / `onPointerMove` / `onPointerUp`，並在 Canvas 容器套 `touch-action: none`
- **理由**：避免雙寫滑鼠 / 觸控；自動避開 iOS Safari 雙擊縮放與被動事件警告

### D5：Canvas 響應式以「虛擬座標 + 縮放」實作，不在每 frame 重算尺寸

- 球場使用固定虛擬座標系（如 600×900）
- 容器以 `ResizeObserver` 觀察；resize 後一次性更新縮放比例
- 渲染時 `ctx.scale(...)` 一次，幾何計算永遠用虛擬座標

### D6：狀態機放在 reducer，所有副作用集中在 `useGameLoop` 與 `GameCanvas`

- States: `idle → serving → incoming → awaiting_input → judging → (scored | violation | miss) → next_ball | game_over`
- Actions: `START`, `BALL_LANDED`, `PLAYER_HIT(point, time)`, `TIMEOUT`, `RESTART`, `PAUSE`, `RESUME`
- **理由**：reducer 為純函式，可表格驅動測試所有 transitions；副作用（RAF / Pointer 事件 / 計時器）由 hook 與 component 層注入

### D7：E2E 為「站內首個」Playwright spec，僅做 smoke + 手機可玩驗證

- spec 路徑：`tests/e2e/specs/play.spec.ts`
- 五個 browser project（Chromium / Firefox / WebKit / Mobile Chrome / Mobile Safari）皆執行
- 涵蓋：`/play` 載入、看到「開始」按鈕、開始後 Canvas 區可接收 pointer 事件、HUD 數字會變
- **理由**：E2E 主要為了驗證「手機可玩」，不重複單元測試的判定邏輯

### D8：入口僅在 Hero 加單一按鈕，不動 TocBar 與其他 section

- Hero 主標題下方、統計區之間／之後加一個 `<a href="/play">` 樣式按鈕
- **理由**：最小化對既有指南的視覺干擾；首頁仍以「閱讀指南」為主，遊戲為延伸練習入口

### 行為邏輯（必 TDD） vs 例外層（選配）

| 模組 | 類別 |
|---|---|
| `lib/play/court.ts` | 行為邏輯（必 TDD） |
| `lib/play/ball.ts` | 行為邏輯（必 TDD） |
| `lib/play/judge.ts` | 行為邏輯（必 TDD，**最關鍵**） |
| `lib/play/state.ts` | 行為邏輯（必 TDD） |
| `lib/play/types.ts` | 型別檔（例外） |
| `hooks/useGameLoop.ts` | 行為邏輯（必 TDD） |
| `data/play/*.ts` | 純資料（例外） |
| `app/play/page.tsx` | 入口（例外） |
| `app/play/layout.tsx`（若需要） | 入口（例外） |
| `components/play/*.tsx` 純呈現部分 | 例外（鼓勵 smoke / E2E） |
| `components/play/GameCanvas.tsx` 含分支邏輯部分 | 行為邏輯（必 TDD 邏輯部分；Canvas drawing 例外） |
| `components/guide/Hero.tsx` 修改部分 | 入口微調（例外，但需透過更新後的 spec scenario 驗收） |
| `tests/e2e/specs/play.spec.ts` | E2E（例外） |

## Risks / Trade-offs

- **Canvas 渲染與測試**：happy-dom 不支援完整 Canvas API → 風險：`GameCanvas.tsx` 內若放邏輯則難以單元測試 → **緩解**：所有邏輯抽到 `lib/play/*` 純函式；`GameCanvas.tsx` 只放 draw call 與 reducer dispatch，由 E2E 涵蓋
- **首次啟用 Playwright E2E 的 CI 影響**：本專案已有 `pnpm test:e2e` 指令但無 spec → 風險：CI 可能尚未安裝 Playwright browsers → **緩解**：tasks 內加上「確認 `pnpm exec playwright install` 已執行 / 文件化」
- **手機效能**：低階裝置 RAF 可能掉幀 → **緩解**：以 deltaTime 驅動插值，不假設固定 60fps
- **iOS Safari 觸控**：雙擊縮放、被動事件 → **緩解**：Pointer Events + `touch-action: none`
- **拋物線「擬真度」**：不真實物理 → **接受**：v1 教學目的優先，視覺合理即可
- **bundle 影響**：`/play` 為 client route，但無外部依賴，影響可忽略
- **無 localStorage 進度**：玩家 reload 後分數重置 → **接受**：v1 不做持久化，避免 hydration mismatch 議題

## Migration Plan

無需資料遷移。新增程式碼為純加法（除 `Hero.tsx` 追加按鈕），可一次合入 main。
回滾：刪除 `app/play/`、`components/play/`、`lib/play/`、`data/play/`、`hooks/useGameLoop.{ts,test.ts}`、`tests/e2e/specs/play.spec.ts`，並 revert `Hero.tsx` 的按鈕新增。

## Open Questions

無。brainstorming 階段已鎖定四項決定：入口位置（Hero）、音效（mute）、結算後規則連結（提供）、橫式佈局（v1 portrait only）。
