import { describe, it, expect } from "vitest";
import { DEFAULT_DIFFICULTY } from "./difficulty";

describe("DEFAULT_DIFFICULTY", () => {
	it("應含四個 number 欄位", () => {
		expect(typeof DEFAULT_DIFFICULTY.ballSpeed).toBe("number");
		expect(typeof DEFAULT_DIFFICULTY.toleranceRadius).toBe("number");
		expect(typeof DEFAULT_DIFFICULTY.kitchenLandingProbability).toBe("number");
		expect(typeof DEFAULT_DIFFICULTY.hitTimeoutMs).toBe("number");
	});
});
