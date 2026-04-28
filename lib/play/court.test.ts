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
