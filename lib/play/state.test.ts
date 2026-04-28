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
