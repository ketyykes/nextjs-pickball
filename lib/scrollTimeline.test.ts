import { describe, it, expect, afterEach } from "vitest";
import { supportsScrollTimeline } from "./scrollTimeline";

describe("supportsScrollTimeline", () => {
	const originalCSS = globalThis.CSS;

	afterEach(() => {
		// 還原全域 CSS
		Object.defineProperty(globalThis, "CSS", {
			configurable: true,
			value: originalCSS,
		});
	});

	it("在 CSS.supports 兩條件皆為 true 時回傳 true", () => {
		Object.defineProperty(globalThis, "CSS", {
			configurable: true,
			value: {
				supports: (q: string) =>
					q === "animation-timeline: scroll()" ||
					q === "animation-range: entry 0% exit 100%",
			},
		});

		expect(supportsScrollTimeline()).toBe(true);
	});

	it("在 CSS.supports 任一條件為 false 時回傳 false", () => {
		Object.defineProperty(globalThis, "CSS", {
			configurable: true,
			value: {
				supports: (q: string) => q === "animation-timeline: scroll()",
			},
		});

		expect(supportsScrollTimeline()).toBe(false);
	});

	it("在 CSS 物件不存在時回傳 false 不拋例外", () => {
		Object.defineProperty(globalThis, "CSS", {
			configurable: true,
			value: undefined,
		});

		expect(() => supportsScrollTimeline()).not.toThrow();
		expect(supportsScrollTimeline()).toBe(false);
	});
});
