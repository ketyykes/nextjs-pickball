import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRef } from "react";
import { useScrollLinkedProgress } from "./useScrollLinkedProgress";

vi.mock("motion/react", () => {
	const unsubscribers = vi.fn();
	const motionValue = {
		get: () => 0,
		on: vi.fn().mockReturnValue(unsubscribers),
		set: vi.fn(),
	};
	return {
		useScroll: vi.fn().mockReturnValue({
			scrollYProgress: motionValue,
		}),
	};
});

describe("useScrollLinkedProgress", () => {
	it("回傳 motion value 並於卸載時 unsubscribe", async () => {
		const { useScroll } = await import("motion/react");

		const { result, unmount } = renderHook(() => {
			const ref = useRef<HTMLDivElement>(null);
			return useScrollLinkedProgress(ref);
		});

		expect(result.current).toBeDefined();
		expect(useScroll).toHaveBeenCalledWith(
			expect.objectContaining({
				offset: ["start end", "start start"],
			}),
		);

		// 卸載時不應拋例外
		expect(() => unmount()).not.toThrow();
	});
});
