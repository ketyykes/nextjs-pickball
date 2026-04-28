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
