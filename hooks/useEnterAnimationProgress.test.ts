import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRef } from "react";
import { useEnterAnimationProgress } from "./useEnterAnimationProgress";

vi.mock("motion/react", () => {
	const animate = vi.fn().mockReturnValue({ stop: vi.fn() });
	const useInView = vi.fn();
	const useMotionValue = vi.fn().mockImplementation((init: number) => ({
		get: () => init,
		set: vi.fn(),
		on: vi.fn().mockReturnValue(() => {}),
	}));
	return { animate, useInView, useMotionValue };
});

describe("useEnterAnimationProgress", () => {
	beforeEach(async () => {
		const motion = await import("motion/react");
		(motion.animate as unknown as { mockClear: () => void }).mockClear();
		(motion.useInView as unknown as { mockReset: () => void }).mockReset();
	});

	it("元素未進入 viewport 時不觸發 animate", async () => {
		const motion = await import("motion/react");
		(
			motion.useInView as unknown as {
				mockReturnValue: (v: boolean) => void;
			}
		).mockReturnValue(false);

		renderHook(() => {
			const ref = useRef<HTMLDivElement>(null);
			return useEnterAnimationProgress(ref);
		});

		expect(motion.animate).not.toHaveBeenCalled();
	});

	it("元素進入 viewport 後啟動 0→1 motion 動畫", async () => {
		const motion = await import("motion/react");
		(
			motion.useInView as unknown as {
				mockReturnValue: (v: boolean) => void;
			}
		).mockReturnValue(true);

		renderHook(() => {
			const ref = useRef<HTMLDivElement>(null);
			return useEnterAnimationProgress(ref);
		});

		expect(motion.animate).toHaveBeenCalledTimes(1);
		expect(motion.animate).toHaveBeenCalledWith(
			expect.anything(),
			1,
			expect.objectContaining({ duration: expect.any(Number) }),
		);
	});

	it("卸載時呼叫 stop 取消動畫", async () => {
		const motion = await import("motion/react");
		const stop = vi.fn();
		(
			motion.animate as unknown as { mockReturnValue: (v: unknown) => void }
		).mockReturnValue({ stop });
		(
			motion.useInView as unknown as {
				mockReturnValue: (v: boolean) => void;
			}
		).mockReturnValue(true);

		const { unmount } = renderHook(() => {
			const ref = useRef<HTMLDivElement>(null);
			return useEnterAnimationProgress(ref);
		});

		unmount();

		expect(stop).toHaveBeenCalled();
	});
});
