import type { Action, Mode, ScoreboardState, Team } from "./types";

/**
 * 建立記分板的初始狀態（immutable factory）。
 *
 * 雙打規則：先發球隊的第一位發球員從「2 號伺服員」開始，
 * 且 isFirstServiceOfGame=true 代表本局第一次換邊發球時不換人。
 * 單打規則：直接從 1 號發球員開始，無特殊規則。
 */
export function createInitialState(
	overrides: { mode?: Mode; firstServer?: Team } = {},
): ScoreboardState {
	const mode: Mode = overrides.mode ?? "doubles";
	const firstServer: Team = overrides.firstServer ?? "us";
	const isDoubles = mode === "doubles";

	return {
		mode,
		scores: { us: 0, them: 0 },
		servingTeam: firstServer,
		// 雙打：2 號伺服員起手；單打：1 號伺服員起手
		serverNumber: isDoubles ? 2 : 1,
		// 雙打才有「本局第一發」的特殊規則
		isFirstServiceOfGame: isDoubles,
		history: [],
		status: "setup",
		winner: null,
	};
}

/**
 * 記分板 reducer。
 *
 * 目前只處理 setup 階段的兩個設定 action：
 * - SET_MODE：切換單/雙打模式
 * - SET_FIRST_SERVER：切換先發球隊
 *
 * 其他 action（RALLY_WON / UNDO / RESET / HYDRATE）待 Task 8-10 實作。
 */
export function scoreboardReducer(
	state: ScoreboardState,
	action: Action,
): ScoreboardState {
	switch (action.type) {
		case "SET_MODE": {
			// playing/finished 階段不允許變更設定
			if (state.status !== "setup") return state;
			// 重新建立初始狀態，保留現有的先發球隊設定
			return createInitialState({
				mode: action.mode,
				// 注意：setup 階段 servingTeam === firstServer，故此處代理可行。
				// Task 9 加入 state.firstServer 欄位後，這行需改為 firstServer: state.firstServer
				firstServer: state.servingTeam,
			});
		}
		case "SET_FIRST_SERVER": {
			// playing/finished 階段不允許變更設定
			if (state.status !== "setup") return state;
			// 重新建立初始狀態，保留現有的模式設定
			return createInitialState({
				mode: state.mode,
				firstServer: action.team,
			});
		}
		default:
			// 其他 action 暫時 pass through，待後續 task 實作
			return state;
	}
}
