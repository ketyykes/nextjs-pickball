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
			// 從 serving / incoming / next_ball 三種狀態進入 awaiting_input。
			// （簡化版 GameCanvas 直接 serving→awaiting_input，未經過獨立 incoming 階段）
			if (
				state.status === "serving" ||
				state.status === "incoming" ||
				state.status === "next_ball"
			) {
				return { ...state, status: "awaiting_input", lastResult: null };
			}
			return state;
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
