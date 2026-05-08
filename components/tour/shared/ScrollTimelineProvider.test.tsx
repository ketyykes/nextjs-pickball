import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRef, type ReactNode } from "react";
import {
	ScrollTimelineProvider,
	useScrollTimelineSupport,
	useStageProgress,
} from "./ScrollTimelineProvider";

vi.mock("@/lib/scrollTimeline", () => ({
	supportsScrollTimeline: vi.fn(),
}));

vi.mock("@/hooks/useReducedMotion", () => ({
	useReducedMotion: vi.fn(),
}));

vi.mock("@/hooks/useEnterAnimationProgress", () => ({
	useEnterAnimationProgress: vi.fn(),
}));

describe("ScrollTimelineProvider", () => {
	beforeEach(async () => {
		const { supportsScrollTimeline } = await import("@/lib/scrollTimeline");
		(supportsScrollTimeline as unknown as { mockReset: () => void }).mockReset();
	});

	it("透過 context 提供 supportsScrollTimeline 偵測結果", async () => {
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

		// useSyncExternalStore 的 client snapshot 於 render 階段同步取得偵測值
		expect(result.current).toBe(true);
		expect(supportsScrollTimeline).toHaveBeenCalled();
	});

	it("useScrollTimelineSupport 在 Provider 外呼叫時回傳 false 預設值", () => {
		const { result } = renderHook(() => useScrollTimelineSupport());
		expect(result.current).toBe(false);
	});
});

describe("useStageProgress", () => {
	beforeEach(async () => {
		const { useReducedMotion } = await import("@/hooks/useReducedMotion");
		const { useEnterAnimationProgress } = await import(
			"@/hooks/useEnterAnimationProgress"
		);
		const { supportsScrollTimeline } = await import("@/lib/scrollTimeline");
		(useReducedMotion as unknown as { mockReset: () => void }).mockReset();
		(
			useEnterAnimationProgress as unknown as { mockReset: () => void }
		).mockReset();
		(
			supportsScrollTimeline as unknown as { mockReset: () => void }
		).mockReset();
	});

	it("reduced motion 啟用時回傳 null", async () => {
		const { useReducedMotion } = await import("@/hooks/useReducedMotion");
		const { useEnterAnimationProgress } = await import(
			"@/hooks/useEnterAnimationProgress"
		);
		const { supportsScrollTimeline } = await import("@/lib/scrollTimeline");
		(
			useReducedMotion as unknown as {
				mockReturnValue: (v: boolean) => void;
			}
		).mockReturnValue(true);
		(
			supportsScrollTimeline as unknown as {
				mockReturnValue: (v: boolean) => void;
			}
		).mockReturnValue(false);
		const fakeMotionValue = { get: () => 0 };
		(
			useEnterAnimationProgress as unknown as {
				mockReturnValue: (v: unknown) => void;
			}
		).mockReturnValue(fakeMotionValue);

		const wrapper = ({ children }: { children: ReactNode }) => (
			<ScrollTimelineProvider>{children}</ScrollTimelineProvider>
		);

		const { result } = renderHook(
			() => {
				const ref = useRef<HTMLElement>(null);
				return useStageProgress(ref);
			},
			{ wrapper },
		);

		expect(result.current).toBeNull();
	});

	it("scroll-timeline 支援時仍回 motion value（永遠走 motion path）", async () => {
		const { useReducedMotion } = await import("@/hooks/useReducedMotion");
		const { useEnterAnimationProgress } = await import(
			"@/hooks/useEnterAnimationProgress"
		);
		const { supportsScrollTimeline } = await import("@/lib/scrollTimeline");
		(
			useReducedMotion as unknown as {
				mockReturnValue: (v: boolean) => void;
			}
		).mockReturnValue(false);
		(
			supportsScrollTimeline as unknown as {
				mockReturnValue: (v: boolean) => void;
			}
		).mockReturnValue(true);
		const fakeMotionValue = { get: () => 0 };
		(
			useEnterAnimationProgress as unknown as {
				mockReturnValue: (v: unknown) => void;
			}
		).mockReturnValue(fakeMotionValue);

		const wrapper = ({ children }: { children: ReactNode }) => (
			<ScrollTimelineProvider>{children}</ScrollTimelineProvider>
		);

		const { result } = renderHook(
			() => {
				const ref = useRef<HTMLElement>(null);
				return useStageProgress(ref);
			},
			{ wrapper },
		);

		// supported 為 true 不再短路為 null：counter 等 React 文字節點需要連續 motion value
		expect(result.current).toEqual(fakeMotionValue);
	});

	it("既不 reduced 也不支援時回傳 motion value", async () => {
		const { useReducedMotion } = await import("@/hooks/useReducedMotion");
		const { useEnterAnimationProgress } = await import(
			"@/hooks/useEnterAnimationProgress"
		);
		const { supportsScrollTimeline } = await import("@/lib/scrollTimeline");
		(
			useReducedMotion as unknown as {
				mockReturnValue: (v: boolean) => void;
			}
		).mockReturnValue(false);
		(
			supportsScrollTimeline as unknown as {
				mockReturnValue: (v: boolean) => void;
			}
		).mockReturnValue(false);
		const fakeMotionValue = { get: () => 0 };
		(
			useEnterAnimationProgress as unknown as {
				mockReturnValue: (v: unknown) => void;
			}
		).mockReturnValue(fakeMotionValue);

		const wrapper = ({ children }: { children: ReactNode }) => (
			<ScrollTimelineProvider>{children}</ScrollTimelineProvider>
		);

		const { result } = renderHook(
			() => {
				const ref = useRef<HTMLElement>(null);
				return useStageProgress(ref);
			},
			{ wrapper },
		);

		expect(result.current).toBe(fakeMotionValue);
	});
});
