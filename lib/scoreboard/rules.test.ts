import { describe, it, expect } from "vitest";
import { getServeSide } from "./rules";

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
