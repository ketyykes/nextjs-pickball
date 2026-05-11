import { describe, it, expect } from "vitest";
import { scoreboardReducer, createInitialState } from "./reducer";
import type { ScoreboardState } from "./types";

describe("createInitialState", () => {
	it("預設為雙打、我方先發、0-0-2 起手", () => {
		const state = createInitialState();
		expect(state.mode).toBe("doubles");
		expect(state.servingTeam).toBe("us");
		expect(state.serverNumber).toBe(2);
		expect(state.isFirstServiceOfGame).toBe(true);
		expect(state.status).toBe("setup");
		expect(state.scores).toEqual({ us: 0, them: 0 });
		expect(state.history).toEqual([]);
		expect(state.winner).toBeNull();
	});

	it("可傳入 mode 與 firstServer 客製", () => {
		const state = createInitialState({ mode: "singles", firstServer: "them" });
		expect(state.mode).toBe("singles");
		expect(state.servingTeam).toBe("them");
		expect(state.serverNumber).toBe(1);
		expect(state.isFirstServiceOfGame).toBe(false);
	});
});

describe("scoreboardReducer — SET_MODE / SET_FIRST_SERVER", () => {
	it("setup 階段可切換 mode；切換到 singles 時 serverNumber=1、isFirstService=false", () => {
		const state = createInitialState();
		const next = scoreboardReducer(state, { type: "SET_MODE", mode: "singles" });
		expect(next.mode).toBe("singles");
		expect(next.serverNumber).toBe(1);
		expect(next.isFirstServiceOfGame).toBe(false);
	});

	it("setup 階段可切換 firstServer", () => {
		const state = createInitialState();
		const next = scoreboardReducer(state, {
			type: "SET_FIRST_SERVER",
			team: "them",
		});
		expect(next.servingTeam).toBe("them");
	});

	it("playing 階段 ignore SET_MODE", () => {
		const state: ScoreboardState = { ...createInitialState(), status: "playing" };
		const next = scoreboardReducer(state, { type: "SET_MODE", mode: "singles" });
		expect(next).toBe(state);
	});

	it("playing 階段 ignore SET_FIRST_SERVER", () => {
		const state: ScoreboardState = { ...createInitialState(), status: "playing" };
		const next = scoreboardReducer(state, {
			type: "SET_FIRST_SERVER",
			team: "them",
		});
		expect(next).toBe(state);
	});
});
