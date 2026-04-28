import { describe, it, expect } from "vitest";
import { judgeHit, judgeTimeout } from "./judge";

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

describe("judgeTimeout", () => {
	it("超過時限應視為 timeout", () => {
		expect(judgeTimeout(3500, 3000)).toBe(true);
	});

	it("未超過時限應回傳 false", () => {
		expect(judgeTimeout(2500, 3000)).toBe(false);
	});
});
