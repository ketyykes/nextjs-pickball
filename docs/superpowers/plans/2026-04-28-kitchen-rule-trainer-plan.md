# Kitchen Rule Trainer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Next.js 16 匹克球指南專案新增獨立路由 `/play`，做一個 Canvas 小遊戲「Kitchen Rule Trainer」，讓使用者實際練習 Non-Volley Zone 規則；首頁 Hero 加入口連結。

**Architecture:** 純 Canvas + React，行為邏輯（區域判定、球軌跡、判定、reducer）抽成 `lib/play/` 純函式並嚴格 TDD；RAF 由 `hooks/useGameLoop` 包裝可注入時間源；`components/play/` 為呈現層；E2E 用 Playwright 五個 browser project（含 Mobile Chrome / Mobile Safari）自動驗證手機可玩。

**Tech Stack:** Next.js 16 App Router、React 19、TypeScript（strict、`verbatimModuleSyntax: true`）、Tailwind v4、shadcn/ui（Card、Button）、Vitest + happy-dom、Playwright。**不引入** phaser / pixi.js / matter-js / three / @react-three。

**Source artifacts（已通過 `openspec validate --strict`）：**
- `openspec/changes/add-kitchen-rule-trainer/proposal.md`
- `openspec/changes/add-kitchen-rule-trainer/design.md`
- `openspec/changes/add-kitchen-rule-trainer/specs/kitchen-rule-trainer/spec.md`
- `openspec/changes/add-kitchen-rule-trainer/specs/pickleball-guide-page/spec.md`
- `openspec/changes/add-kitchen-rule-trainer/tasks.md`

---

## File Structure

| 路徑 | 類別 | 責任 |
|---|---|---|
| `lib/play/types.ts` | 型別檔（例外） | 共用型別（Point / GameState / GameAction / JudgeResult / Difficulty） |
| `lib/play/court.ts` + `.test.ts` | 行為邏輯（TDD） | 球場虛擬座標、Kitchen 區域判定 |
| `lib/play/ball.ts` + `.test.ts` | 行為邏輯（TDD） | 拋物線參數化插值 |
| `lib/play/judge.ts` + `.test.ts` | 行為邏輯（TDD，**最關鍵**） | 違規／合法／miss 判定、timeout 判定 |
| `lib/play/state.ts` + `.test.ts` | 行為邏輯（TDD） | 遊戲狀態 reducer |
| `data/play/ruleCards.ts` | 純資料（例外） | Kitchen 規則小卡文案 |
| `data/play/difficulty.ts` + `.test.ts` | 純資料 + 型別 smoke（TDD-1） | 難度參數 `DEFAULT_DIFFICULTY` |
| `hooks/useGameLoop.ts` + `.test.ts` | 行為邏輯（TDD） | 以 deltaTime 驅動的 RAF 包裝、可注入時間源 |
| `components/play/HUD.tsx` | 呈現 | 分數 / 命數 / 連擊 |
| `components/play/StartScreen.tsx` | 呈現（"use client"） | 開始畫面 |
| `components/play/RuleCard.tsx` | 呈現（"use client"） | 違規規則小卡（2 秒自動關閉） |
| `components/play/PauseOverlay.tsx` | 呈現（"use client"） | 暫停層 |
| `components/play/GameOverModal.tsx` | 呈現（"use client"） | 結算 modal + 回首頁連結 |
| `components/play/GameCanvas.tsx` | 呈現 + 整合（"use client"） | Canvas 渲染、Pointer Events、useReducer + useGameLoop |
| `app/play/page.tsx` | 入口（例外） | `/play` route 組合 |
| `components/guide/Hero.tsx`（修改） | 入口微調 | 加入 `data-testid="hero-play-link"` 連結 |
| `tests/e2e/specs/play.spec.ts` | E2E（例外） | Playwright 五 project smoke + 互動 |

**測試 import 慣例**（看過 `hooks/useFadeInOnView.test.ts`）：

```ts
import { describe, it, expect } from "vitest";
// 或需要 mock：import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
```

雖然 vitest globals 啟用，仍**顯式 import** 以對齊既有檔案。

**縮排**：使用 tab（與既有 `.ts` / `.tsx` 一致）。

---

## Pre-flight

### Task 0: 建立 feature branch 並確認工作區乾淨

**Files:**
- 無（git 操作）

- [ ] **Step 0.1: 確認當前 git status 並決定處理方式**

Run: `git status`
Expected: 看到目前修改清單；`app/page.tsx` 與 `.claude/settings.json` 為既有未提交內容。決定 stash 或先 commit 既有工作。

- [ ] **Step 0.2: 建立並切換到 feature branch**

Run: `git switch -c feat/kitchen-rule-trainer`
Expected: `Switched to a new branch 'feat/kitchen-rule-trainer'`

- [ ] **Step 0.3: 建立目錄骨架**

Run: `mkdir -p app/play components/play lib/play data/play tests/e2e/specs`
Expected: 無輸出；`ls app/play components/play lib/play data/play tests/e2e/specs` 各為空目錄

- [ ] **Step 0.4: Commit 骨架（empty dirs 不會被 git 追蹤，這步等到第一份檔進來再 commit）**

無動作；先繼續 Task 1。

---

## Phase 1: 型別與資料骨架（例外層）

### Task 1: `lib/play/types.ts`（共用型別）

**Files:**
- Create: `lib/play/types.ts`

- [ ] **Step 1.1: 寫出共用型別**

```ts
export interface Point {
	x: number;
	y: number;
}

export type GameStatus =
	| "idle"
	| "serving"
	| "incoming"
	| "awaiting_input"
	| "judging"
	| "next_ball"
	| "game_over";

export type BallState = "in_air" | "after_bounce";

export type JudgeResult =
	| { kind: "legal" }
	| { kind: "violation_kitchen" }
	| { kind: "miss" };

export interface GameState {
	status: GameStatus;
	score: number;
	lives: number;
	combo: number;
	lastResult: "legal" | "violation_kitchen" | "miss" | null;
}

export type GameAction =
	| { type: "START" }
	| { type: "BALL_LANDED" }
	| { type: "PLAYER_HIT"; result: JudgeResult }
	| { type: "TIMEOUT" }
	| { type: "RESTART" }
	| { type: "PAUSE" }
	| { type: "RESUME" };

export interface Difficulty {
	ballSpeed: number;
	toleranceRadius: number;
	kitchenLandingProbability: number;
	hitTimeoutMs: number;
}
```

- [ ] **Step 1.2: 驗證 TS 編譯**

Run: `pnpm tsc --noEmit`
Expected: 無錯誤輸出

- [ ] **Step 1.3: Commit**

```bash
git add lib/play/types.ts
git commit -m "chore(play): 新增遊戲共用型別 lib/play/types"
```

---

### Task 2: `data/play/ruleCards.ts`（規則文案常數）

**Files:**
- Create: `data/play/ruleCards.ts`

- [ ] **Step 2.1: 寫出規則文案**

```ts
export interface RuleCard {
	id: string;
	title: string;
	body: string;
}

export const RULE_CARDS: readonly RuleCard[] = [
	{
		id: "kitchen",
		title: "Kitchen（禁打高球區）規則",
		body: "球落在 Kitchen 區域內時，必須等球落地一次（bounce）後才能擊球。直接 volley 視為違規。",
	},
] as const;

export const KITCHEN_RULE_TIP =
	"提示：球若落在綠色區域（Kitchen）內，記得等它彈一次再打！";
```

- [ ] **Step 2.2: 驗證 TS 編譯**

Run: `pnpm tsc --noEmit`
Expected: 無錯誤輸出

- [ ] **Step 2.3: Commit**

```bash
git add data/play/ruleCards.ts
git commit -m "chore(play): 新增 Kitchen 規則小卡文案"
```

---

## Phase 2: 純函式與資料 smoke（TDD）

> spec scenario「DEFAULT_DIFFICULTY 應含四個 number 欄位」

### Task 3: `data/play/difficulty.ts`（TDD）

**Files:**
- Create: `data/play/difficulty.test.ts`
- Create: `data/play/difficulty.ts`

- [ ] **Step 3.1: 寫失敗測試**

```ts
// data/play/difficulty.test.ts
import { describe, it, expect } from "vitest";
import { DEFAULT_DIFFICULTY } from "./difficulty";

describe("DEFAULT_DIFFICULTY", () => {
	it("應含四個 number 欄位", () => {
		expect(typeof DEFAULT_DIFFICULTY.ballSpeed).toBe("number");
		expect(typeof DEFAULT_DIFFICULTY.toleranceRadius).toBe("number");
		expect(typeof DEFAULT_DIFFICULTY.kitchenLandingProbability).toBe("number");
		expect(typeof DEFAULT_DIFFICULTY.hitTimeoutMs).toBe("number");
	});
});
```

- [ ] **Step 3.2: 跑測試確認紅燈**

Run: `pnpm test -- --run data/play/difficulty.test.ts`
Expected: FAIL，訊息含 `Cannot find module './difficulty'` 或同等錯誤

- [ ] **Step 3.3: 寫最小實作**

```ts
// data/play/difficulty.ts
import type { Difficulty } from "@/lib/play/types";

export const DEFAULT_DIFFICULTY: Difficulty = {
	ballSpeed: 0.4,
	toleranceRadius: 60,
	kitchenLandingProbability: 0.5,
	hitTimeoutMs: 3000,
};
```

- [ ] **Step 3.4: 跑測試確認綠燈**

Run: `pnpm test -- --run data/play/difficulty.test.ts`
Expected: PASS，1 個 it 通過

- [ ] **Step 3.5: Refactor**

檢視實作；無壞味道則於本 step checkbox 旁註記 `（skipped — 無壞味道）`

- [ ] **Step 3.6: Commit**

```bash
git add data/play/difficulty.ts data/play/difficulty.test.ts
git commit -m "test(play): 新增 difficulty 資料模組與型別 smoke 測試"
```

---

### Task 4: `lib/play/court.ts`（TDD — Kitchen 區域判定）

> spec scenarios：「落點位於 Kitchen 區域內應回傳 true」、「落點位於 Kitchen 區域外應回傳 false」
>
> 座標決定：球場 600×900，AI 在頂（y=0），玩家在底（y=900）。網位於 y=600，玩家側 Kitchen 為 y∈[600, 750] 全寬。如此 `{x:300,y:720}` 在 Kitchen 內，`{x:300,y:850}`（玩家底線附近）在 Kitchen 外。

**Files:**
- Create: `lib/play/court.test.ts`
- Create: `lib/play/court.ts`

- [ ] **Step 4.1: 寫失敗測試**

```ts
// lib/play/court.test.ts
import { describe, it, expect } from "vitest";
import { isInKitchen, COURT_BOUNDS, KITCHEN_BOUNDS } from "./court";

describe("isInKitchen", () => {
	it("落點位於 Kitchen 區域內應回傳 true", () => {
		expect(isInKitchen({ x: 300, y: 720 })).toBe(true);
	});

	it("落點位於 Kitchen 區域外應回傳 false", () => {
		expect(isInKitchen({ x: 300, y: 850 })).toBe(false);
	});
});

describe("COURT_BOUNDS / KITCHEN_BOUNDS", () => {
	it("COURT_BOUNDS 為 600x900 虛擬座標系", () => {
		expect(COURT_BOUNDS.right - COURT_BOUNDS.left).toBe(600);
		expect(COURT_BOUNDS.bottom - COURT_BOUNDS.top).toBe(900);
	});

	it("KITCHEN_BOUNDS 位於玩家側", () => {
		expect(KITCHEN_BOUNDS.top).toBeGreaterThanOrEqual(450);
		expect(KITCHEN_BOUNDS.bottom).toBeLessThan(900);
	});
});
```

- [ ] **Step 4.2: 跑測試確認紅燈**

Run: `pnpm test -- --run lib/play/court.test.ts`
Expected: FAIL（找不到模組）

- [ ] **Step 4.3: 寫最小實作**

```ts
// lib/play/court.ts
import type { Point } from "./types";

export interface Bounds {
	left: number;
	right: number;
	top: number;
	bottom: number;
}

// 虛擬座標：球場 600×900，AI 於 y=0、玩家於 y=900；網於 y=600。
export const COURT_BOUNDS: Bounds = {
	left: 0,
	right: 600,
	top: 0,
	bottom: 900,
};

// 玩家側 Kitchen：網（y=600）到 y=750，全寬。
export const KITCHEN_BOUNDS: Bounds = {
	left: 0,
	right: 600,
	top: 600,
	bottom: 750,
};

export function isInKitchen(point: Point): boolean {
	return (
		point.x >= KITCHEN_BOUNDS.left &&
		point.x <= KITCHEN_BOUNDS.right &&
		point.y >= KITCHEN_BOUNDS.top &&
		point.y <= KITCHEN_BOUNDS.bottom
	);
}
```

- [ ] **Step 4.4: 跑測試確認綠燈**

Run: `pnpm test -- --run lib/play/court.test.ts`
Expected: PASS，4 個 it 通過

- [ ] **Step 4.5: Refactor**

無壞味道則註記 skipped。

- [ ] **Step 4.6: Commit**

```bash
git add lib/play/court.ts lib/play/court.test.ts
git commit -m "test(play): 新增球場與 Kitchen 區域判定純函式"
```

---

### Task 5: `lib/play/ball.ts`（TDD — 拋物線插值）

> spec scenarios：「t=0 時應回傳起點且高度 0」、「t=1 時應回傳落點且高度 0」、「t=0.5 時應回傳線性中點且高度等於 peakHeight」

**Files:**
- Create: `lib/play/ball.test.ts`
- Create: `lib/play/ball.ts`

- [ ] **Step 5.1: 寫失敗測試**

```ts
// lib/play/ball.test.ts
import { describe, it, expect } from "vitest";
import { interpolateBall } from "./ball";

const start = { x: 0, y: 0 };
const end = { x: 600, y: 900 };
const peak = 200;

describe("interpolateBall", () => {
	it("t=0 時應回傳起點且高度 0", () => {
		expect(interpolateBall(start, end, peak, 0)).toEqual({
			x: 0,
			y: 0,
			height: 0,
		});
	});

	it("t=1 時應回傳落點且高度 0", () => {
		expect(interpolateBall(start, end, peak, 1)).toEqual({
			x: 600,
			y: 900,
			height: 0,
		});
	});

	it("t=0.5 時應回傳線性中點且高度等於 peakHeight", () => {
		expect(interpolateBall(start, end, peak, 0.5)).toEqual({
			x: 300,
			y: 450,
			height: 200,
		});
	});
});
```

- [ ] **Step 5.2: 跑測試確認紅燈**

Run: `pnpm test -- --run lib/play/ball.test.ts`
Expected: FAIL

- [ ] **Step 5.3: 寫最小實作**

```ts
// lib/play/ball.ts
import type { Point } from "./types";

// 給定起點、落點、最高弧高與時間進度 t∈[0,1]，回傳當前 (x,y) 與視覺高度。
// 高度公式 4*peakHeight*t*(1-t)：t=0 → 0，t=0.5 → peakHeight，t=1 → 0。
export function interpolateBall(
	start: Point,
	end: Point,
	peakHeight: number,
	t: number,
): { x: number; y: number; height: number } {
	const x = start.x + (end.x - start.x) * t;
	const y = start.y + (end.y - start.y) * t;
	const height = 4 * peakHeight * t * (1 - t);
	return { x, y, height };
}
```

- [ ] **Step 5.4: 跑測試確認綠燈**

Run: `pnpm test -- --run lib/play/ball.test.ts`
Expected: PASS，3 個 it 通過

- [ ] **Step 5.5: Refactor**

無壞味道則註記 skipped。

- [ ] **Step 5.6: Commit**

```bash
git add lib/play/ball.ts lib/play/ball.test.ts
git commit -m "test(play): 新增球軌跡拋物線插值純函式"
```

---

### Task 6: `lib/play/judge.ts` — `judgeHit`（TDD，**最關鍵**）

> spec scenarios：「球落 Kitchen 內且玩家 volley 應判違規」、「球落 Kitchen 內且玩家等 bounce 應判合法」、「球落 Kitchen 外且玩家 volley 應判合法」、「球拍距落點超過容忍半徑應判 miss」

**Files:**
- Create: `lib/play/judge.test.ts`
- Create: `lib/play/judge.ts`

- [ ] **Step 6.1: 寫失敗測試**

```ts
// lib/play/judge.test.ts
import { describe, it, expect } from "vitest";
import { judgeHit } from "./judge";

const baseInput = {
	landingPoint: { x: 300, y: 720 }, // Kitchen 內
	paddlePoint: { x: 305, y: 720 }, // 距落點 5
	toleranceRadius: 40,
} as const;

describe("judgeHit", () => {
	it("球落 Kitchen 內且玩家 volley 應判違規", () => {
		const result = judgeHit({ ...baseInput, ballState: "in_air" });
		expect(result).toEqual({ kind: "violation_kitchen" });
	});

	it("球落 Kitchen 內且玩家等 bounce 應判合法", () => {
		const result = judgeHit({ ...baseInput, ballState: "after_bounce" });
		expect(result).toEqual({ kind: "legal" });
	});

	it("球落 Kitchen 外且玩家 volley 應判合法", () => {
		const result = judgeHit({
			...baseInput,
			landingPoint: { x: 300, y: 850 },
			paddlePoint: { x: 305, y: 850 },
			ballState: "in_air",
		});
		expect(result).toEqual({ kind: "legal" });
	});

	it("球拍距落點超過容忍半徑應判 miss", () => {
		const result = judgeHit({
			...baseInput,
			paddlePoint: { x: 500, y: 720 },
			ballState: "after_bounce",
		});
		expect(result).toEqual({ kind: "miss" });
	});
});
```

- [ ] **Step 6.2: 跑測試確認紅燈**

Run: `pnpm test -- --run lib/play/judge.test.ts`
Expected: FAIL

- [ ] **Step 6.3: 寫最小實作**

```ts
// lib/play/judge.ts
import { isInKitchen } from "./court";
import type { BallState, JudgeResult, Point } from "./types";

export interface JudgeHitInput {
	landingPoint: Point;
	ballState: BallState;
	paddlePoint: Point;
	toleranceRadius: number;
}

export function judgeHit(input: JudgeHitInput): JudgeResult {
	const { landingPoint, ballState, paddlePoint, toleranceRadius } = input;
	const dx = paddlePoint.x - landingPoint.x;
	const dy = paddlePoint.y - landingPoint.y;
	const distance = Math.sqrt(dx * dx + dy * dy);
	if (distance > toleranceRadius) {
		return { kind: "miss" };
	}
	if (isInKitchen(landingPoint) && ballState === "in_air") {
		return { kind: "violation_kitchen" };
	}
	return { kind: "legal" };
}
```

- [ ] **Step 6.4: 跑測試確認綠燈**

Run: `pnpm test -- --run lib/play/judge.test.ts`
Expected: PASS，4 個 it 通過

- [ ] **Step 6.5: Refactor**

無壞味道則註記 skipped。

- [ ] **Step 6.6: Commit**

```bash
git add lib/play/judge.ts lib/play/judge.test.ts
git commit -m "test(play): 新增 judgeHit 違規／合法／miss 判定純函式"
```

---

### Task 7: `lib/play/judge.ts` — `judgeTimeout`（TDD）

> spec scenario：「超過時限應視為 timeout」

**Files:**
- Modify: `lib/play/judge.test.ts`
- Modify: `lib/play/judge.ts`

- [ ] **Step 7.1: 在既有測試檔加入新 it**

附加至 `lib/play/judge.test.ts` 末尾（在 `describe("judgeHit", ...)` 之外）：

```ts
import { judgeTimeout } from "./judge";

describe("judgeTimeout", () => {
	it("超過時限應視為 timeout", () => {
		expect(judgeTimeout(3500, 3000)).toBe(true);
	});

	it("未超過時限應回傳 false", () => {
		expect(judgeTimeout(2500, 3000)).toBe(false);
	});
});
```

調整檔案頂部 import：

```ts
import { judgeHit, judgeTimeout } from "./judge";
```

（移除 Step 7.1 中重複的 `import { judgeTimeout } from "./judge"`，改為合併 import。）

- [ ] **Step 7.2: 跑測試確認紅燈**

Run: `pnpm test -- --run lib/play/judge.test.ts`
Expected: FAIL（`judgeTimeout` 未定義）

- [ ] **Step 7.3: 在實作檔加入 judgeTimeout**

附加至 `lib/play/judge.ts`：

```ts
export function judgeTimeout(elapsedMs: number, timeoutMs: number): boolean {
	return elapsedMs > timeoutMs;
}
```

- [ ] **Step 7.4: 跑測試確認綠燈**

Run: `pnpm test -- --run lib/play/judge.test.ts`
Expected: PASS，全部 6 個 it 通過

- [ ] **Step 7.5: Refactor**

無壞味道則註記 skipped。

- [ ] **Step 7.6: Commit**

```bash
git add lib/play/judge.ts lib/play/judge.test.ts
git commit -m "test(play): 新增 judgeTimeout 時限判定"
```

---

### Task 8: `lib/play/state.ts` — 基本 transitions（TDD）

> spec scenarios：「idle 收到 START 應重置分數並進入 serving」、「合法擊球應加分並累積連擊」、「連擊累積後合法擊球倍率正確」、「judging 狀態下應忽略額外的 PLAYER_HIT」

**Files:**
- Create: `lib/play/state.test.ts`
- Create: `lib/play/state.ts`

- [ ] **Step 8.1: 寫失敗測試**

```ts
// lib/play/state.test.ts
import { describe, it, expect } from "vitest";
import { gameReducer, initialState } from "./state";
import type { GameState } from "./types";

describe("gameReducer — 基本 transitions", () => {
	it("idle 收到 START 應重置分數並進入 serving", () => {
		const next = gameReducer(initialState, { type: "START" });
		expect(next).toEqual<GameState>({
			status: "serving",
			score: 0,
			lives: 3,
			combo: 0,
			lastResult: null,
		});
	});

	it("合法擊球應加分並累積連擊", () => {
		const start: GameState = {
			status: "awaiting_input",
			score: 0,
			lives: 3,
			combo: 0,
			lastResult: null,
		};
		const next = gameReducer(start, {
			type: "PLAYER_HIT",
			result: { kind: "legal" },
		});
		expect(next).toEqual<GameState>({
			status: "next_ball",
			score: 10,
			lives: 3,
			combo: 1,
			lastResult: "legal",
		});
	});

	it("連擊累積後合法擊球倍率正確", () => {
		const start: GameState = {
			status: "awaiting_input",
			score: 60,
			lives: 3,
			combo: 3,
			lastResult: "legal",
		};
		const next = gameReducer(start, {
			type: "PLAYER_HIT",
			result: { kind: "legal" },
		});
		expect(next.score).toBe(100);
		expect(next.combo).toBe(4);
	});

	it("judging 狀態下應忽略額外的 PLAYER_HIT", () => {
		const start: GameState = {
			status: "judging",
			score: 0,
			lives: 3,
			combo: 0,
			lastResult: null,
		};
		const next = gameReducer(start, {
			type: "PLAYER_HIT",
			result: { kind: "legal" },
		});
		expect(next).toEqual(start);
	});
});
```

- [ ] **Step 8.2: 跑測試確認紅燈**

Run: `pnpm test -- --run lib/play/state.test.ts`
Expected: FAIL

- [ ] **Step 8.3: 寫最小實作**

```ts
// lib/play/state.ts
import type { GameAction, GameState, JudgeResult } from "./types";

export const initialState: GameState = {
	status: "idle",
	score: 0,
	lives: 3,
	combo: 0,
	lastResult: null,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
	switch (action.type) {
		case "START":
		case "RESTART":
			return { ...initialState, status: "serving" };
		case "PLAYER_HIT":
			if (state.status === "judging") return state;
			return applyResult(state, action.result);
		case "TIMEOUT":
			return applyResult(state, { kind: "miss" });
		case "BALL_LANDED":
			return state.status === "incoming"
				? { ...state, status: "awaiting_input" }
				: state;
		case "PAUSE":
		case "RESUME":
			return state;
		default:
			return state;
	}
}

function applyResult(state: GameState, result: JudgeResult): GameState {
	if (result.kind === "legal") {
		const newCombo = state.combo + 1;
		return {
			...state,
			status: "next_ball",
			score: state.score + 10 * newCombo,
			combo: newCombo,
			lastResult: "legal",
		};
	}
	const newLives = state.lives - 1;
	return {
		...state,
		status: newLives <= 0 ? "game_over" : "next_ball",
		lives: Math.max(0, newLives),
		combo: 0,
		lastResult: result.kind === "violation_kitchen" ? "violation_kitchen" : "miss",
	};
}
```

- [ ] **Step 8.4: 跑測試確認綠燈**

Run: `pnpm test -- --run lib/play/state.test.ts`
Expected: PASS，4 個 it 通過

- [ ] **Step 8.5: Refactor**

檢視 `applyResult` 的 lastResult 三元；目前可讀，註記 skipped。

- [ ] **Step 8.6: Commit**

```bash
git add lib/play/state.ts lib/play/state.test.ts
git commit -m "test(play): 新增遊戲狀態 reducer 與基本 transitions"
```

---

### Task 9: `lib/play/state.ts` — 違規／命數／重啟（TDD）

> spec scenarios：「違規 Kitchen 應扣 1 命並重置連擊」、「命數歸零後應進入 game_over」、「game_over 收到 RESTART 應重置分數命數並進入 serving」

**Files:**
- Modify: `lib/play/state.test.ts`

- [ ] **Step 9.1: 在既有測試檔加入新 describe**

附加至 `lib/play/state.test.ts` 末尾：

```ts
describe("gameReducer — 違規／命數／重啟", () => {
	it("違規 Kitchen 應扣 1 命並重置連擊", () => {
		const start: GameState = {
			status: "awaiting_input",
			score: 30,
			lives: 3,
			combo: 2,
			lastResult: "legal",
		};
		const next = gameReducer(start, {
			type: "PLAYER_HIT",
			result: { kind: "violation_kitchen" },
		});
		expect(next).toEqual<GameState>({
			status: "next_ball",
			score: 30,
			lives: 2,
			combo: 0,
			lastResult: "violation_kitchen",
		});
	});

	it("命數歸零後應進入 game_over", () => {
		const start: GameState = {
			status: "awaiting_input",
			score: 50,
			lives: 1,
			combo: 0,
			lastResult: null,
		};
		const next = gameReducer(start, { type: "TIMEOUT" });
		expect(next.status).toBe("game_over");
		expect(next.lives).toBe(0);
	});

	it("game_over 收到 RESTART 應重置分數命數並進入 serving", () => {
		const start: GameState = {
			status: "game_over",
			score: 50,
			lives: 0,
			combo: 0,
			lastResult: "miss",
		};
		const next = gameReducer(start, { type: "RESTART" });
		expect(next).toEqual<GameState>({
			status: "serving",
			score: 0,
			lives: 3,
			combo: 0,
			lastResult: null,
		});
	});
});
```

- [ ] **Step 9.2: 跑測試確認紅燈**

Run: `pnpm test -- --run lib/play/state.test.ts`
Expected: 視 Task 8 實作而定。若 Task 8 已涵蓋全部邏輯（START/RESTART 共用、TIMEOUT 走 applyResult），這裡會 PASS — 即視為 **task 8 已完整實作所有 reducer 行為**，本 task 僅追加測試覆蓋。**這仍符合 TDD：每個 spec scenario 都有對應 failing-then-passing 的測試提交歷史**（task 8 沒有這 3 個 case，所以「沒有測試 → 沒有保證」，這次補上即補保證）。

> 若想嚴格地看到紅燈：在 Step 9.1 前先把 Task 8 的 `applyResult` 內 `lastResult` 改成只回 'legal'/'miss'（暫時破壞 violation_kitchen 邏輯）→ 跑測試看到紅燈 → 還原 → 再跑看到綠燈。**這步建議跳過**，避免人工製造錯誤。

- [ ] **Step 9.3: 跑測試確認綠燈（最終狀態）**

Run: `pnpm test -- --run lib/play/state.test.ts`
Expected: PASS，全部 7 個 it 通過

- [ ] **Step 9.4: Refactor**

無壞味道則註記 skipped。

- [ ] **Step 9.5: Commit**

```bash
git add lib/play/state.test.ts
git commit -m "test(play): 補強 reducer 違規／命數／重啟測試覆蓋"
```

---

## Phase 3: hooks/useGameLoop（TDD）

### Task 10: `hooks/useGameLoop.ts`（TDD — RAF 包裝）

> spec scenarios：「啟用後應每 tick 呼叫 callback 並傳入 deltaMs」、「enabled 為 false 時不應啟動 RAF」、「卸載時應取消 RAF」

**Files:**
- Create: `hooks/useGameLoop.test.ts`
- Create: `hooks/useGameLoop.ts`

- [ ] **Step 10.1: 寫失敗測試**

```ts
// hooks/useGameLoop.test.ts
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGameLoop } from "./useGameLoop";

describe("useGameLoop", () => {
	it("啟用後應每 tick 呼叫 callback 並傳入 deltaMs", () => {
		let scheduled: FrameRequestCallback | null = null;
		let nowValue = 1000;
		const now = () => nowValue;
		const raf = vi.fn((cb: FrameRequestCallback) => {
			scheduled = cb;
			return 1;
		});
		const cancel = vi.fn();
		const callback = vi.fn();

		renderHook(() =>
			useGameLoop(callback, { now, raf, cancel, enabled: true }),
		);

		// 模擬 16ms 後第一次 tick
		nowValue += 16;
		scheduled?.(nowValue);

		expect(callback).toHaveBeenCalled();
		const deltas = callback.mock.calls.map((args) => args[0] as number);
		expect(deltas).toContain(16);
	});

	it("enabled 為 false 時不應啟動 RAF", () => {
		const raf = vi.fn();
		const cancel = vi.fn();
		const callback = vi.fn();

		renderHook(() =>
			useGameLoop(callback, {
				now: () => 0,
				raf,
				cancel,
				enabled: false,
			}),
		);

		expect(raf).not.toHaveBeenCalled();
	});

	it("卸載時應取消 RAF", () => {
		const raf = vi.fn(() => 42);
		const cancel = vi.fn();
		const callback = vi.fn();

		const { unmount } = renderHook(() =>
			useGameLoop(callback, {
				now: () => 0,
				raf,
				cancel,
				enabled: true,
			}),
		);

		unmount();
		expect(cancel).toHaveBeenCalled();
	});
});
```

- [ ] **Step 10.2: 跑測試確認紅燈**

Run: `pnpm test -- --run hooks/useGameLoop.test.ts`
Expected: FAIL（找不到模組）

- [ ] **Step 10.3: 寫最小實作**

```ts
// hooks/useGameLoop.ts
"use client";

import { useEffect, useRef } from "react";

export interface UseGameLoopOptions {
	now?: () => number;
	raf?: (cb: FrameRequestCallback) => number;
	cancel?: (id: number) => void;
	enabled?: boolean;
}

// RAF 迴圈，以 deltaMs 驅動 callback；可注入時間源以利測試。
export function useGameLoop(
	callback: (deltaMs: number) => void,
	options: UseGameLoopOptions = {},
): void {
	const {
		now = () => performance.now(),
		raf = (cb: FrameRequestCallback) => requestAnimationFrame(cb),
		cancel = (id: number) => cancelAnimationFrame(id),
		enabled = true,
	} = options;

	const callbackRef = useRef(callback);
	callbackRef.current = callback;

	useEffect(() => {
		if (!enabled) return;
		let lastTime = now();
		let rafId = 0;

		const tick: FrameRequestCallback = () => {
			const current = now();
			const deltaMs = current - lastTime;
			lastTime = current;
			callbackRef.current(deltaMs);
			rafId = raf(tick);
		};

		rafId = raf(tick);

		return () => {
			cancel(rafId);
		};
	}, [enabled, now, raf, cancel]);
}
```

- [ ] **Step 10.4: 跑測試確認綠燈**

Run: `pnpm test -- --run hooks/useGameLoop.test.ts`
Expected: PASS，3 個 it 通過

- [ ] **Step 10.5: Refactor**

註記 skipped 或重構 effect 內 closure。

- [ ] **Step 10.6: Commit**

```bash
git add hooks/useGameLoop.ts hooks/useGameLoop.test.ts
git commit -m "test(play): 新增 useGameLoop RAF 包裝 hook"
```

---

## Phase 4: 呈現元件群

### Task 11: `components/play/HUD.tsx`

**Files:**
- Create: `components/play/HUD.tsx`

- [ ] **Step 11.1: 寫元件**

```tsx
// components/play/HUD.tsx
interface HUDProps {
	score: number;
	lives: number;
	combo: number;
}

export function HUD({ score, lives, combo }: HUDProps) {
	return (
		<div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4 text-white">
			<div data-testid="hud-score" className="font-bebas text-2xl">
				分數 {score}
			</div>
			<div
				data-testid="hud-combo"
				className="font-bebas text-xl text-lime-400"
			>
				x{combo}
			</div>
			<div data-testid="hud-lives" className="font-bebas text-2xl">
				{Array.from({ length: lives }, () => "❤").join(" ")}
			</div>
		</div>
	);
}
```

- [ ] **Step 11.2: 驗證 TS 編譯**

Run: `pnpm tsc --noEmit`
Expected: 無錯誤

- [ ] **Step 11.3: Commit**

```bash
git add components/play/HUD.tsx
git commit -m "feat(play): 新增 HUD 顯示分數／連擊／命數"
```

---

### Task 12: `components/play/StartScreen.tsx`

**Files:**
- Create: `components/play/StartScreen.tsx`

- [ ] **Step 12.1: 寫元件**

```tsx
// components/play/StartScreen.tsx
"use client";

import { Button } from "@/components/ui/button";
import { KITCHEN_RULE_TIP } from "@/data/play/ruleCards";

interface StartScreenProps {
	visible: boolean;
	onStart: () => void;
}

export function StartScreen({ visible, onStart }: StartScreenProps) {
	if (!visible) return null;
	return (
		<div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-slate-900/95 px-6 text-center text-white">
			<h2 className="text-3xl font-bold">Kitchen 規則訓練</h2>
			<p className="max-w-sm text-sm text-white/70">{KITCHEN_RULE_TIP}</p>
			<Button
				data-testid="play-start-button"
				size="lg"
				onClick={onStart}
				className="bg-lime-400 text-slate-900 hover:bg-lime-300"
			>
				開始
			</Button>
		</div>
	);
}
```

- [ ] **Step 12.2: 驗證 TS 編譯**

Run: `pnpm tsc --noEmit`
Expected: 無錯誤

- [ ] **Step 12.3: Commit**

```bash
git add components/play/StartScreen.tsx
git commit -m "feat(play): 新增開始畫面 StartScreen"
```

---

### Task 13: `components/play/RuleCard.tsx`

**Files:**
- Create: `components/play/RuleCard.tsx`

- [ ] **Step 13.1: 寫元件**

```tsx
// components/play/RuleCard.tsx
"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RULE_CARDS } from "@/data/play/ruleCards";

interface RuleCardProps {
	visible: boolean;
	onClose: () => void;
}

export function RuleCard({ visible, onClose }: RuleCardProps) {
	useEffect(() => {
		if (!visible) return;
		const id = window.setTimeout(onClose, 2000);
		return () => window.clearTimeout(id);
	}, [visible, onClose]);

	if (!visible) return null;
	const card = RULE_CARDS[0];
	return (
		<div
			data-testid="rule-card-kitchen"
			className="absolute inset-x-4 top-20 z-30 mx-auto max-w-sm"
		>
			<Card className="border-orange-400 bg-white">
				<CardContent className="p-4">
					<h3 className="mb-2 text-base font-bold text-orange-600">
						{card.title}
					</h3>
					<p className="text-sm text-slate-700">{card.body}</p>
				</CardContent>
			</Card>
		</div>
	);
}
```

- [ ] **Step 13.2: 驗證 TS 編譯**

Run: `pnpm tsc --noEmit`
Expected: 無錯誤

- [ ] **Step 13.3: Commit**

```bash
git add components/play/RuleCard.tsx
git commit -m "feat(play): 新增違規規則小卡 RuleCard"
```

---

### Task 14: `components/play/PauseOverlay.tsx`

**Files:**
- Create: `components/play/PauseOverlay.tsx`

- [ ] **Step 14.1: 寫元件**

```tsx
// components/play/PauseOverlay.tsx
"use client";

import { Button } from "@/components/ui/button";

interface PauseOverlayProps {
	visible: boolean;
	onResume: () => void;
}

export function PauseOverlay({ visible, onResume }: PauseOverlayProps) {
	if (!visible) return null;
	return (
		<div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/70">
			<Button data-testid="resume-button" onClick={onResume}>
				繼續
			</Button>
		</div>
	);
}
```

- [ ] **Step 14.2: 驗證 TS 編譯**

Run: `pnpm tsc --noEmit`
Expected: 無錯誤

- [ ] **Step 14.3: Commit**

```bash
git add components/play/PauseOverlay.tsx
git commit -m "feat(play): 新增暫停層 PauseOverlay"
```

---

### Task 15: `components/play/GameOverModal.tsx`

**Files:**
- Create: `components/play/GameOverModal.tsx`

- [ ] **Step 15.1: 寫元件**

```tsx
// components/play/GameOverModal.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GameOverModalProps {
	visible: boolean;
	score: number;
	bestCombo: number;
	onRestart: () => void;
}

export function GameOverModal({
	visible,
	score,
	bestCombo,
	onRestart,
}: GameOverModalProps) {
	if (!visible) return null;
	return (
		<div
			data-testid="game-over-modal"
			className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/80 p-4"
		>
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>結算</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 text-center">
					<div>
						<div className="font-bebas text-5xl">{score}</div>
						<div className="text-sm text-muted-foreground">總分</div>
						<div className="mt-2 text-sm text-muted-foreground">
							最高連擊 x{bestCombo}
						</div>
					</div>
					<Button data-testid="restart-button" onClick={onRestart}>
						再玩一次
					</Button>
					<a
						href="/#kitchen"
						className="text-sm text-emerald-700 underline"
					>
						查看 Kitchen 規則詳細說明
					</a>
				</CardContent>
			</Card>
		</div>
	);
}
```

- [ ] **Step 15.2: 驗證 TS 編譯**

Run: `pnpm tsc --noEmit`
Expected: 無錯誤

- [ ] **Step 15.3: Commit**

```bash
git add components/play/GameOverModal.tsx
git commit -m "feat(play): 新增結算 modal GameOverModal"
```

---

### Task 16: `components/play/GameCanvas.tsx`（整合元件）

**Files:**
- Create: `components/play/GameCanvas.tsx`

> 整合 useReducer + useGameLoop + ResizeObserver + Pointer Events + Canvas drawing。最複雜的呈現元件；驗收以 E2E 為主。

- [ ] **Step 16.1: 寫元件骨架（state、refs、發球）**

```tsx
// components/play/GameCanvas.tsx
"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useGameLoop } from "@/hooks/useGameLoop";
import { interpolateBall } from "@/lib/play/ball";
import { COURT_BOUNDS, KITCHEN_BOUNDS } from "@/lib/play/court";
import { judgeHit, judgeTimeout } from "@/lib/play/judge";
import { gameReducer, initialState } from "@/lib/play/state";
import type { Point } from "@/lib/play/types";
import { DEFAULT_DIFFICULTY } from "@/data/play/difficulty";
import { GameOverModal } from "./GameOverModal";
import { HUD } from "./HUD";
import { PauseOverlay } from "./PauseOverlay";
import { RuleCard } from "./RuleCard";
import { StartScreen } from "./StartScreen";

interface BallShot {
	start: Point;
	end: Point;
	peakHeight: number;
	spawnedAt: number;
	durationMs: number;
	hasBounced: boolean;
}

const PADDLE_RADIUS = 28;
const BALL_RADIUS = 10;

export function GameCanvas() {
	const containerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [state, dispatch] = useReducer(gameReducer, initialState);
	const [paddle, setPaddle] = useState<Point>({ x: 300, y: 880 });
	const [paused, setPaused] = useState(false);
	const [ruleCardVisible, setRuleCardVisible] = useState(false);
	const ballRef = useRef<BallShot | null>(null);
	const elapsedSinceServeRef = useRef(0);
	const elapsedSinceAwaitRef = useRef(0);
	const bestComboRef = useRef(0);

	// 後續 step 補實作
	return null;
}
```

- [ ] **Step 16.2: 驗證 TS 編譯（只看 import 與骨架）**

Run: `pnpm tsc --noEmit`
Expected: 無錯誤（暫時 return null 是合法 ReactNode）

- [ ] **Step 16.3: 補入 ResizeObserver、發球、useGameLoop、Pointer 處理、render**

替換 `return null;` 為以下完整內容（並把所有 helper 補進元件內）：

```tsx
	// === 視窗縮放 ===
	useEffect(() => {
		const container = containerRef.current;
		const canvas = canvasRef.current;
		if (!container || !canvas) return;
		const updateSize = () => {
			const dpr = window.devicePixelRatio || 1;
			const { width, height } = container.getBoundingClientRect();
			canvas.width = Math.max(1, Math.floor(width * dpr));
			canvas.height = Math.max(1, Math.floor(height * dpr));
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
		};
		updateSize();
		const observer = new ResizeObserver(updateSize);
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	// === 發球：serving 立即發、next_ball 短暫延遲後發 ===
	useEffect(() => {
		if (state.status === "serving") {
			spawnBall();
			elapsedSinceServeRef.current = 0;
			dispatch({ type: "BALL_LANDED" }); // serving → awaiting_input（簡化版直接進入接球階段）
		}
		if (state.status === "next_ball") {
			const id = window.setTimeout(() => {
				spawnBall();
				elapsedSinceServeRef.current = 0;
				elapsedSinceAwaitRef.current = 0;
				dispatch({ type: "BALL_LANDED" });
			}, 600);
			return () => window.clearTimeout(id);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state.status]);

	function spawnBall() {
		const isKitchenLanding =
			Math.random() < DEFAULT_DIFFICULTY.kitchenLandingProbability;
		const landingY = isKitchenLanding
			? randInRange(KITCHEN_BOUNDS.top + 10, KITCHEN_BOUNDS.bottom - 10)
			: randInRange(KITCHEN_BOUNDS.bottom + 10, COURT_BOUNDS.bottom - 30);
		const landingX = randInRange(
			COURT_BOUNDS.left + 30,
			COURT_BOUNDS.right - 30,
		);
		ballRef.current = {
			start: { x: 300, y: 30 },
			end: { x: landingX, y: landingY },
			peakHeight: 220,
			spawnedAt: performance.now(),
			durationMs: 1200,
			hasBounced: false,
		};
	}

	// === 違規規則卡顯示控制（state.lastResult / state.lives 變化即觸發）===
	useEffect(() => {
		if (state.lastResult === "violation_kitchen") {
			setRuleCardVisible(true);
		}
	}, [state.lastResult, state.lives]);
	const handleRuleCardClose = useCallback(() => setRuleCardVisible(false), []);

	// === 連擊紀錄 ===
	useEffect(() => {
		if (state.combo > bestComboRef.current) {
			bestComboRef.current = state.combo;
		}
	}, [state.combo]);

	// === 主迴圈 ===
	const loopEnabled =
		!paused &&
		state.status !== "idle" &&
		state.status !== "game_over";

	useGameLoop(
		(dt) => {
			elapsedSinceAwaitRef.current += dt;
			elapsedSinceServeRef.current += dt;
			drawScene();
			// 球落地：t 過 1 第一次 → 標記 hasBounced
			const ball = ballRef.current;
			if (ball && !ball.hasBounced) {
				const t =
					(performance.now() - ball.spawnedAt) / ball.durationMs;
				if (t >= 1) ball.hasBounced = true;
			}
			// timeout 檢查
			if (state.status === "awaiting_input") {
				if (
					judgeTimeout(
						elapsedSinceAwaitRef.current,
						DEFAULT_DIFFICULTY.hitTimeoutMs,
					)
				) {
					dispatch({ type: "TIMEOUT" });
				}
			}
		},
		{ enabled: loopEnabled },
	);

	// === Pointer 處理 ===
	function getCourtPoint(e: React.PointerEvent<HTMLDivElement>): Point {
		const rect = e.currentTarget.getBoundingClientRect();
		const scaleX = COURT_BOUNDS.right / rect.width;
		const scaleY = COURT_BOUNDS.bottom / rect.height;
		return {
			x: (e.clientX - rect.left) * scaleX,
			y: (e.clientY - rect.top) * scaleY,
		};
	}

	function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
		setPaddle(getCourtPoint(e));
	}

	function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
		const point = getCourtPoint(e);
		setPaddle(point);
		const ball = ballRef.current;
		if (!ball) return;
		if (state.status !== "awaiting_input") return;
		const result = judgeHit({
			landingPoint: ball.end,
			ballState: ball.hasBounced ? "after_bounce" : "in_air",
			paddlePoint: point,
			toleranceRadius: DEFAULT_DIFFICULTY.toleranceRadius,
		});
		dispatch({ type: "PLAYER_HIT", result });
	}

	// === Canvas 繪製 ===
	function drawScene() {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const w = canvas.width;
		const h = canvas.height;
		const sx = w / COURT_BOUNDS.right;
		const sy = h / COURT_BOUNDS.bottom;

		ctx.clearRect(0, 0, w, h);
		// 球場底色
		ctx.fillStyle = "#0e3b2e";
		ctx.fillRect(0, 0, w, h);

		// Kitchen 區域高亮
		ctx.fillStyle = "rgba(163,230,53,0.2)";
		ctx.fillRect(
			KITCHEN_BOUNDS.left * sx,
			KITCHEN_BOUNDS.top * sy,
			(KITCHEN_BOUNDS.right - KITCHEN_BOUNDS.left) * sx,
			(KITCHEN_BOUNDS.bottom - KITCHEN_BOUNDS.top) * sy,
		);

		// 球場線
		ctx.strokeStyle = "rgba(255,255,255,0.6)";
		ctx.lineWidth = Math.max(2, 2 * Math.min(sx, sy));
		ctx.strokeRect(0, 0, COURT_BOUNDS.right * sx, COURT_BOUNDS.bottom * sy);
		// 網（中間略高一點）
		ctx.beginPath();
		ctx.moveTo(0, COURT_BOUNDS.bottom * 0.5 * sy);
		ctx.lineTo(COURT_BOUNDS.right * sx, COURT_BOUNDS.bottom * 0.5 * sy);
		ctx.stroke();
		// Kitchen 邊界線
		ctx.beginPath();
		ctx.moveTo(0, KITCHEN_BOUNDS.bottom * sy);
		ctx.lineTo(COURT_BOUNDS.right * sx, KITCHEN_BOUNDS.bottom * sy);
		ctx.stroke();

		// 球
		const ball = ballRef.current;
		if (ball) {
			const t = clamp01(
				(performance.now() - ball.spawnedAt) / ball.durationMs,
			);
			const phase = t <= 1 ? t : 1 + (t - 1) * 0.4;
			const tInner = t <= 1 ? t : Math.min(1, (t - 1) * 2.5);
			const pos = interpolateBall(
				ball.start,
				ball.end,
				ball.peakHeight,
				tInner,
			);
			const shadowAlpha = 0.5 - Math.min(0.4, pos.height / 600);
			// 影子
			ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
			ctx.beginPath();
			ctx.ellipse(
				pos.x * sx,
				pos.y * sy,
				BALL_RADIUS * sx,
				BALL_RADIUS * sy * 0.5,
				0,
				0,
				Math.PI * 2,
			);
			ctx.fill();
			// 球本體（高度愈高愈大、愈亮）
			const radiusScale = 1 + pos.height / 240;
			ctx.fillStyle = "#fde047";
			ctx.beginPath();
			ctx.arc(
				pos.x * sx,
				(pos.y - pos.height) * sy,
				BALL_RADIUS * radiusScale * Math.min(sx, sy),
				0,
				Math.PI * 2,
			);
			ctx.fill();
			// 標記未使用變數
			void phase;
		}

		// 球拍
		ctx.fillStyle = "rgba(248,250,252,0.95)";
		ctx.beginPath();
		ctx.arc(
			paddle.x * sx,
			paddle.y * sy,
			PADDLE_RADIUS * Math.min(sx, sy),
			0,
			Math.PI * 2,
		);
		ctx.fill();
		ctx.strokeStyle = "#0f172a";
		ctx.lineWidth = 2;
		ctx.stroke();
	}

	return (
		<div
			ref={containerRef}
			data-testid="game-canvas-container"
			className="relative h-full min-h-[600px] w-full overflow-hidden bg-emerald-950"
			style={{ touchAction: "none" }}
			onPointerMove={handlePointerMove}
			onPointerDown={handlePointerDown}
		>
			<canvas ref={canvasRef} className="block h-full w-full" />
			<HUD score={state.score} lives={state.lives} combo={state.combo} />
			<StartScreen
				visible={state.status === "idle"}
				onStart={() => dispatch({ type: "START" })}
			/>
			<RuleCard visible={ruleCardVisible} onClose={handleRuleCardClose} />
			<PauseOverlay visible={paused} onResume={() => setPaused(false)} />
			<GameOverModal
				visible={state.status === "game_over"}
				score={state.score}
				bestCombo={bestComboRef.current}
				onRestart={() => dispatch({ type: "RESTART" })}
			/>
		</div>
	);
}

function randInRange(a: number, b: number): number {
	return a + Math.random() * (b - a);
}

function clamp01(v: number): number {
	return v < 0 ? 0 : v > 1 ? 1 : v;
}
```

- [ ] **Step 16.4: 驗證 TS 編譯**

Run: `pnpm tsc --noEmit`
Expected: 無錯誤

- [ ] **Step 16.5: 跑 Vitest 全套確認沒有 regressions**

Run: `pnpm test -- --run`
Expected: 所有既有測試（含 hooks、lib/play、data/play）皆 PASS

- [ ] **Step 16.6: Commit**

```bash
git add components/play/GameCanvas.tsx
git commit -m "feat(play): 新增 GameCanvas 整合 reducer/loop/Canvas 繪製"
```

---

## Phase 5: 入口頁

### Task 17: `app/play/page.tsx`

**Files:**
- Create: `app/play/page.tsx`

- [ ] **Step 17.1: 寫入口頁**

```tsx
// app/play/page.tsx
import type { Metadata } from "next";
import { GameCanvas } from "@/components/play/GameCanvas";

export const metadata: Metadata = {
	title: "Kitchen 規則訓練 — 匹克球新手完全入門",
	description:
		"以小遊戲方式練習匹克球 Non-Volley Zone（Kitchen）規則：球落 Kitchen 內必須等彈一次再打。",
};

export default function PlayPage() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-6">
			<div className="w-full max-w-md">
				<GameCanvas />
			</div>
		</main>
	);
}
```

- [ ] **Step 17.2: 啟動 dev server，手動 smoke**

Run: `pnpm dev`
Open: `http://localhost:3000/play`
Expected: 看到 StartScreen 的「開始」按鈕；點擊後進入遊戲畫面，能用滑鼠移動球拍、Canvas 渲染球場與 Kitchen 高亮。Ctrl+C 結束 dev server。

- [ ] **Step 17.3: Commit**

```bash
git add app/play/page.tsx
git commit -m "feat(play): 新增 /play route 入口頁"
```

---

## Phase 6: 首頁 Hero 入口連結

### Task 18: 修改 `components/guide/Hero.tsx`

**Files:**
- Modify: `components/guide/Hero.tsx`

> spec delta scenarios：「首頁 Hero 顯示 /play 入口連結」、「點擊 Hero 入口連結後可進入 /play 看到開始按鈕」

- [ ] **Step 18.1: 在統計區下方加入按鈕連結**

於 `components/guide/Hero.tsx` 的統計區 `<div className="flex flex-wrap justify-center gap-12 ...">{...}</div>` 之後（仍位於 `<div className="relative z-[2] max-w-[900px] ...">` 內），插入：

```tsx
import Link from "next/link";
// ...（檔案頂部 import 區追加）
```

並在主內容區塊內、統計區之後加入：

```tsx
<div className="mt-10 flex justify-center animate-fade-up [animation-delay:1s]">
	<Link
		href="/play"
		data-testid="hero-play-link"
		className="rounded-full bg-orange-500 px-8 py-3 font-outfit text-sm font-bold uppercase tracking-[2px] text-white shadow-lg shadow-orange-500/40 transition hover:bg-orange-400"
	>
		練習 Kitchen 規則
	</Link>
</div>
```

- [ ] **Step 18.2: 驗證 TS 編譯**

Run: `pnpm tsc --noEmit`
Expected: 無錯誤

- [ ] **Step 18.3: 啟動 dev server，手動 smoke**

Run: `pnpm dev`
Open: `http://localhost:3000/`
Expected: 首頁 Hero 統計區下方看到橘色「練習 Kitchen 規則」按鈕；點擊抵達 `/play`。Ctrl+C 結束 dev server。

- [ ] **Step 18.4: Commit**

```bash
git add components/guide/Hero.tsx
git commit -m "feat(guide): 在 Hero 加入 /play 練習入口連結"
```

---

## Phase 7: E2E 測試

### Task 19: 安裝 Playwright browsers（一次性）

**Files:**
- 無

- [ ] **Step 19.1: 確認本機已安裝 Playwright browsers**

Run: `pnpm exec playwright install --with-deps chromium`
Expected: 下載完成或「browsers are already installed」

- [ ] **Step 19.2: （選配）安裝其他四個 project 的 browsers**

Run: `pnpm exec playwright install firefox webkit`
Expected: 完成。Mobile Chrome / Mobile Safari 復用 chromium / webkit binary。

---

### Task 20: 撰寫 `tests/e2e/specs/play.spec.ts`

**Files:**
- Create: `tests/e2e/specs/play.spec.ts`

> spec scenarios：「進入 /play 顯示開始按鈕」、「點擊開始按鈕後 HUD 顯示初始分數與三條命」、「GameCanvas 容器套用 touch-action:none」、「行動裝置觸控可觸發擊球並改變 HUD」、「視窗縮小時 Canvas 仍完整顯示球場」、「違規後規則小卡可見」、「game over 後顯示結算 modal 與回首頁規則連結」、「首頁 Hero 顯示 /play 入口連結」、「點擊 Hero 入口連結後可進入 /play 看到開始按鈕」

- [ ] **Step 20.1: 寫 E2E spec（Hero + /play 基本互動）**

```ts
// tests/e2e/specs/play.spec.ts
import { expect, test } from "@playwright/test";

test.describe("Hero → /play 入口", () => {
	test("首頁 Hero 顯示 /play 入口連結", async ({ page }) => {
		await page.goto("/");
		const link = page.getByTestId("hero-play-link");
		await expect(link).toBeVisible();
		await expect(link).toHaveAttribute("href", "/play");
		await expect(link).toContainText("練習");
	});

	test("點擊 Hero 入口連結後可進入 /play 看到開始按鈕", async ({ page }) => {
		await page.goto("/");
		await page.getByTestId("hero-play-link").click();
		await expect(page).toHaveURL("/play");
		await expect(page.getByTestId("play-start-button")).toBeVisible();
	});
});

test.describe("/play 基本流程", () => {
	test("進入 /play 顯示開始按鈕", async ({ page }) => {
		await page.goto("/play");
		await expect(page.getByTestId("play-start-button")).toBeVisible();
	});

	test("點擊開始按鈕後 HUD 顯示初始分數與三條命", async ({ page }) => {
		await page.goto("/play");
		await page.getByTestId("play-start-button").click();
		await expect(page.getByTestId("hud-score")).toContainText("0");
		await expect(page.getByTestId("hud-lives")).toContainText("❤");
		await expect(page.getByTestId("hud-combo")).toContainText("0");
	});

	test("GameCanvas 容器套用 touch-action:none", async ({ page }) => {
		await page.goto("/play");
		await page.getByTestId("play-start-button").click();
		const container = page.getByTestId("game-canvas-container");
		await expect(container).toBeVisible();
		const touchAction = await container.evaluate(
			(el) => getComputedStyle(el as HTMLElement).touchAction,
		);
		expect(touchAction).toBe("none");
	});

	test("視窗縮小時 Canvas 仍完整顯示球場", async ({ page }) => {
		await page.setViewportSize({ width: 360, height: 640 });
		await page.goto("/play");
		await page.getByTestId("play-start-button").click();
		const canvasBox = await page
			.getByTestId("game-canvas-container")
			.locator("canvas")
			.boundingBox();
		expect(canvasBox).not.toBeNull();
		expect(canvasBox!.width).toBeGreaterThan(0);
		expect(canvasBox!.height).toBeGreaterThan(0);
	});
});
```

- [ ] **Step 20.2: 寫進階 E2E（互動、違規、game over）**

附加至 `tests/e2e/specs/play.spec.ts` 末尾：

```ts
test.describe("/play 互動", () => {
	test("行動裝置觸控可觸發擊球並改變 HUD", async ({ page, isMobile }) => {
		test.skip(!isMobile, "僅 mobile project 執行");
		await page.goto("/play");
		await page.getByTestId("play-start-button").click();

		const livesBefore = (
			await page.getByTestId("hud-lives").textContent()
		)?.trim();

		// 等待第一球進入 awaiting_input（spawnBall 後立刻 dispatch BALL_LANDED）
		await page.waitForTimeout(200);
		const container = page.getByTestId("game-canvas-container");
		const box = await container.boundingBox();
		expect(box).not.toBeNull();
		// 在容器中央 tap，視當前球位置而定，可能 legal / violation / miss，但 HUD 必有變化
		await page.tap('[data-testid="game-canvas-container"]', {
			position: { x: box!.width / 2, y: box!.height / 2 },
		});
		// 等待 reducer 處理 + render
		await page.waitForTimeout(300);

		const livesAfter = (
			await page.getByTestId("hud-lives").textContent()
		)?.trim();
		const scoreAfter = await page.getByTestId("hud-score").textContent();
		const comboAfter = await page.getByTestId("hud-combo").textContent();

		// 三項中至少一項相對 livesBefore=❤ ❤ ❤、score=0、combo=0 有變化
		const livesChanged = livesAfter !== livesBefore;
		const scoreChanged = !!scoreAfter && !scoreAfter.includes("0");
		const comboChanged = !!comboAfter && !comboAfter.includes("x0");
		expect(livesChanged || scoreChanged || comboChanged).toBe(true);
	});

	test("違規後規則小卡可見", async ({ page }) => {
		await page.goto("/play");
		await page.getByTestId("play-start-button").click();
		// 嘗試多次點擊 Kitchen 區（容器上 1/3 與中段，球可能在 Kitchen 也可能不在；
		// 機率上多次點擊後應出現違規卡）
		const container = page.getByTestId("game-canvas-container");
		const box = await container.boundingBox();
		expect(box).not.toBeNull();

		const ruleCard = page.getByTestId("rule-card-kitchen");

		for (let i = 0; i < 12; i++) {
			await page.waitForTimeout(150);
			await container.click({
				position: {
					x: box!.width / 2,
					y: box!.height * 0.7,
				},
			});
			if (await ruleCard.isVisible().catch(() => false)) break;
		}
		await expect(ruleCard).toBeVisible({ timeout: 4000 });
	});

	test("game over 後顯示結算 modal 與回首頁規則連結", async ({ page }) => {
		await page.goto("/play");
		await page.getByTestId("play-start-button").click();
		// 三次 timeout = 三次扣命 → game_over（每次 hitTimeoutMs=3000ms，總 ~10 秒）
		// 為加速：直接在 Canvas 之外位置點擊（一定 miss），重複 3 次以上
		const container = page.getByTestId("game-canvas-container");
		const box = await container.boundingBox();
		expect(box).not.toBeNull();

		for (let i = 0; i < 6; i++) {
			await page.waitForTimeout(800);
			// 點極遠處（球拍距離落點很遠）→ judgeHit 回 miss → 扣命
			await container.click({
				position: { x: 5, y: 5 },
			});
		}

		const modal = page.getByTestId("game-over-modal");
		await expect(modal).toBeVisible({ timeout: 8000 });
		const link = modal.locator('a[href="/#kitchen"]');
		await expect(link).toBeVisible();
		await expect(modal.getByTestId("restart-button")).toBeVisible();
	});
});
```

- [ ] **Step 20.3: 跑 chromium project 確認綠燈**

Run: `pnpm test:e2e --project=chromium tests/e2e/specs/play.spec.ts`
Expected: 全部測試通過

- [ ] **Step 20.4: 跑 mobile-chrome 與 mobile-safari project**

Run: `pnpm test:e2e --project=mobile-chrome --project=mobile-safari tests/e2e/specs/play.spec.ts`
Expected: 全部測試通過（觸控測試這時才會跑）

- [ ] **Step 20.5: 跑五個 project**

Run: `pnpm test:e2e tests/e2e/specs/play.spec.ts`
Expected: 五個 project 全綠

> 若 webkit / mobile-safari 因本機 browser 安裝問題失敗，於 commit message 註記哪幾個 project 已驗證；交由 CI。

- [ ] **Step 20.6: Commit**

```bash
git add tests/e2e/specs/play.spec.ts
git commit -m "test(play): 新增首個 e2e spec，涵蓋 /play 與 Hero 入口"
```

---

## Phase 8: 最終驗證

### Task 21: 套件審查

- [ ] **Step 21.1: 確認沒新增遊戲引擎依賴**

Run: `grep -E '"(phaser|pixi.js|matter-js|three|@react-three)' package.json || echo OK`
Expected: 輸出 `OK`

### Task 22: 全套測試

- [ ] **Step 22.1: Vitest 全套**

Run: `pnpm test -- --run`
Expected: 所有檔案 PASS

- [ ] **Step 22.2: ESLint**

Run: `pnpm lint`
Expected: 零錯誤；若有 react-hooks/exhaustive-deps 警告，逐一檢視並修正或加 disable 註記說明原因

- [ ] **Step 22.3: Build**

Run: `pnpm build`
Expected: 成功；輸出含 `/play` route

- [ ] **Step 22.4: E2E 全套（已在 Task 20 跑過，這裡確認）**

Run: `pnpm test:e2e`
Expected: 五個 project 全部 PASS

### Task 23: 手動 smoke

- [ ] **Step 23.1: 桌機**

Run: `pnpm dev`
Open: `http://localhost:3000/`
Expected:
1. 首頁看到「練習 Kitchen 規則」橘色按鈕
2. 點擊後抵達 `/play` 看到開始畫面
3. 點開始 → 球從上方飛來、可移動球拍、點擊球可加分／違規／miss
4. 違規時看到規則小卡並 2 秒自動消失
5. 三命用盡後看到結算 modal、再玩一次能重啟、「查看 Kitchen 規則詳細說明」連結回首頁 `#kitchen`

- [ ] **Step 23.2: 手機 emulation**

Open Chrome DevTools → Toggle device toolbar → 選 iPhone 或 Pixel → 重整 `/play`
Expected:
1. 觸控（在 device toolbar 模式下用滑鼠 = 觸控）能移動球拍與擊球
2. 不會雙擊縮放
3. 視窗旋轉（橫式）至少不破版（v1 不必完美）

### Task 24: OpenSpec 驗證

- [ ] **Step 24.1: 嚴格驗證**

Run: `openspec validate add-kitchen-rule-trainer --strict`
Expected: `Change 'add-kitchen-rule-trainer' is valid`

### Task 25: 標記 OpenSpec tasks 完成

- [ ] **Step 25.1: 更新 `openspec/changes/add-kitchen-rule-trainer/tasks.md`**

將所有完成的 task checkbox 由 `- [ ]` 改為 `- [x]`。

- [ ] **Step 25.2: Commit**

```bash
git add openspec/changes/add-kitchen-rule-trainer/tasks.md
git commit -m "docs(openspec): 標記 add-kitchen-rule-trainer tasks 為完成"
```

### Task 26: 推上遠端 / 開 PR（依需求）

- [ ] **Step 26.1: 推 branch**

Run: `git push -u origin feat/kitchen-rule-trainer`
Expected: 成功推上遠端

- [ ] **Step 26.2: 開 PR（若使用 GitHub）**

> 此步驟需使用者明確要求才執行（依專案 git 安全規則）。

### Task 27: 歸檔（合併入 main 後）

- [ ] **Step 27.1: 歸檔 OpenSpec change**

Run: `openspec archive add-kitchen-rule-trainer`
Expected: change 被移入 `openspec/changes/archive/`，delta specs 同步至 `openspec/specs/`

---

## 風險與注意事項

- **Canvas + happy-dom**：happy-dom 不支援完整 Canvas 2D API。若 GameCanvas 內部需要可單元測試的邏輯，**抽到 lib/play 純函式**；GameCanvas 本身僅由 E2E 涵蓋。
- **Pointer Events 與 mobile project**：Playwright `Pixel 5` / `iPhone 12` device 預設 `hasTouch: true`；測試以 `page.tap` 觸發觸控事件；`isMobile` flag 用來分流。
- **規則卡顯示時序**：用 `[state.lastResult, state.lives]` dep 確保連續違規也能重新觸發（lives 必變）。
- **`react-hooks/exhaustive-deps`**：發球 useEffect 因依賴 `spawnBall` 而需 disable，原因註記於 inline comment。
- **首次 E2E**：本機需先 `pnpm exec playwright install` 一次。CI 端若失敗需於 README/AGENTS.md 註記。
- **Hero 既有動畫節奏**：插入連結時 `animate-fade-up [animation-delay:1s]` 與既有 `0.2s/0.4s/0.6s/0.8s` 節奏一致。
- **不引入遊戲引擎**：spec 明確禁止 phaser / pixi.js / matter-js / three / @react-three。Step 21.1 自動審查。

---

## End-to-End 驗收清單

完成後應一次性通過：

```bash
pnpm test -- --run                       # Vitest 單元測試全綠
pnpm lint                                # ESLint 零錯誤
pnpm build                               # Next.js build 成功且含 /play
pnpm test:e2e                            # Playwright 五 project 全綠
openspec validate add-kitchen-rule-trainer --strict  # OpenSpec 驗證通過
```

外加手動 smoke（Task 23）。
