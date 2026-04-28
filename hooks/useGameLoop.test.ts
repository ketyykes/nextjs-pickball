import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGameLoop } from "./useGameLoop";

describe("useGameLoop", () => {
	it("啟用後應每 tick 呼叫 callback 並傳入 deltaMs", () => {
		let scheduled: FrameRequestCallback | null = null;
		let nowValue = 1000;
		const now = () => nowValue;
		const raf = vi.fn((cb: FrameRequestCallback) => {
			scheduled = cb;
			return 1;
		});
		const cancel = vi.fn();
		const callback = vi.fn();

		renderHook(() =>
			useGameLoop(callback, { now, raf, cancel, enabled: true }),
		);

		// 模擬 16ms 後第一次 tick
		nowValue += 16;
		scheduled?.(nowValue);

		expect(callback).toHaveBeenCalled();
		const deltas = callback.mock.calls.map((args) => args[0] as number);
		expect(deltas).toContain(16);
	});

	it("enabled 為 false 時不應啟動 RAF", () => {
		const raf = vi.fn();
		const cancel = vi.fn();
		const callback = vi.fn();

		renderHook(() =>
			useGameLoop(callback, {
				now: () => 0,
				raf,
				cancel,
				enabled: false,
			}),
		);

		expect(raf).not.toHaveBeenCalled();
	});

	it("卸載時應取消 RAF", () => {
		const raf = vi.fn(() => 42);
		const cancel = vi.fn();
		const callback = vi.fn();

		const { unmount } = renderHook(() =>
			useGameLoop(callback, {
				now: () => 0,
				raf,
				cancel,
				enabled: true,
			}),
		);

		unmount();
		expect(cancel).toHaveBeenCalled();
	});
});
