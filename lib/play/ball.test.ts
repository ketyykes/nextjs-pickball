import { describe, it, expect } from "vitest";
import { interpolateBall } from "./ball";

const start = { x: 0, y: 0 };
const end = { x: 600, y: 900 };
const peak = 200;

describe("interpolateBall", () => {
	it("t=0 時應回傳起點且高度 0", () => {
		expect(interpolateBall(start, end, peak, 0)).toEqual({
			x: 0,
			y: 0,
			height: 0,
		});
	});

	it("t=1 時應回傳落點且高度 0", () => {
		expect(interpolateBall(start, end, peak, 1)).toEqual({
			x: 600,
			y: 900,
			height: 0,
		});
	});

	it("t=0.5 時應回傳線性中點且高度等於 peakHeight", () => {
		expect(interpolateBall(start, end, peak, 0.5)).toEqual({
			x: 300,
			y: 450,
			height: 200,
		});
	});
});
