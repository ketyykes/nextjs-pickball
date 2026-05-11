import type { ServeSide } from "./types";

// 發球位置：發球方當局分數偶數 → 右場，奇數 → 左場
export function getServeSide(servingTeamScore: number): ServeSide {
	return servingTeamScore % 2 === 0 ? "right" : "left";
}
