import type { Point } from "./types";

/**
 * 給定起點、落點、最高弧高與時間進度 t∈[0,1]，回傳當前 (x,y) 與視覺高度。
 * 高度公式 4*peakHeight*t*(1-t)：t=0 → 0，t=0.5 → peakHeight，t=1 → 0。
 */
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
