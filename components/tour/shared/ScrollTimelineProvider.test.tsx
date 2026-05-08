import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import {
	ScrollTimelineProvider,
	useScrollTimelineSupport,
} from "./ScrollTimelineProvider";

vi.mock("@/lib/scrollTimeline", () => ({
	supportsScrollTimeline: vi.fn(),
}));

describe("ScrollTimelineProvider", () => {
	beforeEach(async () => {
		const { supportsScrollTimeline } = await import("@/lib/scrollTimeline");
		(supportsScrollTimeline as unknown as { mockReset: () => void }).mockReset();
	});

	it("於初次掛載偵測一次並透過 context 提供結果", async () => {
		const { supportsScrollTimeline } = await import("@/lib/scrollTimeline");
		(
			supportsScrollTimeline as unknown as {
				mockReturnValue: (v: boolean) => void;
			}
		).mockReturnValue(true);

		const wrapper = ({ children }: { children: ReactNode }) => (
			<ScrollTimelineProvider>{children}</ScrollTimelineProvider>
		);

		const { result } = renderHook(() => useScrollTimelineSupport(), {
			wrapper,
		});

		// useEffect 後觸發更新
		await act(async () => {});

		expect(result.current).toBe(true);
		expect(supportsScrollTimeline).toHaveBeenCalledTimes(1);
	});

	it("useScrollTimelineSupport 在 Provider 外呼叫時回傳 false 預設值", () => {
		const { result } = renderHook(() => useScrollTimelineSupport());
		expect(result.current).toBe(false);
	});
});
