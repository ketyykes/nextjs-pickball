import type { ScoreboardState, ServeSide, Team } from "./types";

// 發球位置：發球方當局分數偶數 → 右場，奇數 → 左場
export function getServeSide(servingTeamScore: number): ServeSide {
	return servingTeamScore % 2 === 0 ? "right" : "left";
}

// 勝利判定：任一方達 11 分且差距 ≥ 2
export function isGameWon(scores: { us: number; them: number }): {
	won: boolean;
	winner: Team | null;
} {
	const { us, them } = scores;
	const max = Math.max(us, them);
	if (max < 11) return { won: false, winner: null };
	const diff = Math.abs(us - them);
	if (diff < 2) return { won: false, winner: null };
	return { won: true, winner: us > them ? "us" : "them" };
}

// 套用一次 rally 結果，回傳更新後 state（不變更傳入物件）
export function applyRallyResult(
	state: ScoreboardState,
	rallyWinner: Team,
): ScoreboardState {
	// 發球方贏 → 該方 +1，發球權不變
	if (rallyWinner === state.servingTeam) {
		return {
			...state,
			scores: { ...state.scores, [rallyWinner]: state.scores[rallyWinner] + 1 },
			isFirstServiceOfGame: false,
		};
	}
	// 接發方贏 → side-out（單打恒 side-out；雙打分支於 Task 5 加）
	return {
		...state,
		servingTeam: rallyWinner,
		serverNumber: 1,
		isFirstServiceOfGame: false,
	};
}
