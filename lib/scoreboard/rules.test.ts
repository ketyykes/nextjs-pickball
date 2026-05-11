import { describe, it, expect } from "vitest";
import { getServeSide, isGameWon } from "./rules";

describe("getServeSide", () => {
	it("發球方分數偶數時從右場發", () => {
		expect(getServeSide(0)).toBe("right");
		expect(getServeSide(2)).toBe("right");
		expect(getServeSide(10)).toBe("right");
	});

	it("發球方分數奇數時從左場發", () => {
		expect(getServeSide(1)).toBe("left");
		expect(getServeSide(3)).toBe("left");
		expect(getServeSide(9)).toBe("left");
	});
});

describe("isGameWon", () => {
	it("任一方未達 11 → 未贏", () => {
		expect(isGameWon({ us: 10, them: 9 })).toEqual({ won: false, winner: null });
		expect(isGameWon({ us: 0, them: 0 })).toEqual({ won: false, winner: null });
	});

	it("達 11 但差距未滿 2 → 未贏（延長賽，雙方領先皆然）", () => {
		expect(isGameWon({ us: 11, them: 10 })).toEqual({ won: false, winner: null });
		expect(isGameWon({ us: 12, them: 11 })).toEqual({ won: false, winner: null });
		expect(isGameWon({ us: 10, them: 11 })).toEqual({ won: false, winner: null });
		expect(isGameWon({ us: 11, them: 12 })).toEqual({ won: false, winner: null });
	});

	it("達 11 且差距 ≥ 2 → 我方贏", () => {
		expect(isGameWon({ us: 11, them: 9 })).toEqual({ won: true, winner: "us" });
		expect(isGameWon({ us: 13, them: 11 })).toEqual({ won: true, winner: "us" });
	});

	it("對方達 11 且差距 ≥ 2 → 對方贏", () => {
		expect(isGameWon({ us: 7, them: 11 })).toEqual({ won: true, winner: "them" });
		expect(isGameWon({ us: 11, them: 13 })).toEqual({ won: true, winner: "them" });
	});

	it("雙方平局 → 未贏", () => {
		expect(isGameWon({ us: 11, them: 11 })).toEqual({ won: false, winner: null });
		expect(isGameWon({ us: 12, them: 12 })).toEqual({ won: false, winner: null });
	});
});
