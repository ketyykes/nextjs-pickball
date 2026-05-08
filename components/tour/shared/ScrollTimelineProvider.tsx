"use client";

import {
	createContext,
	useContext,
	useSyncExternalStore,
	type ReactNode,
	type RefObject,
} from "react";
import type { MotionValue } from "motion/react";
import { supportsScrollTimeline } from "@/lib/scrollTimeline";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useEnterAnimationProgress } from "@/hooks/useEnterAnimationProgress";

interface ScrollTimelineContextValue {
	readonly supported: boolean;
	readonly containerRef: RefObject<HTMLElement | null> | undefined;
}

const defaultContext: ScrollTimelineContextValue = {
	supported: false,
	containerRef: undefined,
};

const ScrollTimelineContext =
	createContext<ScrollTimelineContextValue>(defaultContext);

// 偵測值不會於 runtime 變動，因此 subscribe 為 noop。
// useSyncExternalStore 的 server snapshot 永遠回 false，client snapshot 回實際偵測，
// React 會於 hydration 階段使用 server snapshot 對齊 SSR 結果，避免 hydration mismatch。
const subscribe = () => () => {};
const getClientSnapshot = () => supportsScrollTimeline();
const getServerSnapshot = () => false;

interface ScrollTimelineProviderProps {
	children: ReactNode;
	// 若 /tour 的 stage 位於內部 scroll container（main h-screen overflow-y-scroll），
	// 需把該 container 的 ref 傳進來，子元件 useScroll 才能正確讀取捲動進度。
	containerRef?: RefObject<HTMLElement | null>;
}

export function ScrollTimelineProvider({
	children,
	containerRef,
}: ScrollTimelineProviderProps) {
	const supported = useSyncExternalStore(
		subscribe,
		getClientSnapshot,
		getServerSnapshot,
	);

	const value: ScrollTimelineContextValue = {
		supported,
		containerRef,
	};

	return (
		<ScrollTimelineContext.Provider value={value}>
			{children}
		</ScrollTimelineContext.Provider>
	);
}

export function useScrollTimelineSupport(): boolean {
	return useContext(ScrollTimelineContext).supported;
}

// 統一抽象：stage 進入 viewport 時觸發一次性 0→1 motion 動畫，作為 stage 內部
// useTransform 的進度來源。reduced-motion 時回 null（stage 走靜態 fallback class）。
// 採用「進場觸發」而非 scroll-driven 是因為 /tour 用 snap-mandatory，沒有「捲動進度」
// 的中間態可看；進場一次性動畫直觀且每 stage snap 進入時都會播放完整動畫。
export function useStageProgress(
	target: RefObject<HTMLElement | null>,
): MotionValue<number> | null {
	const { containerRef } = useContext(ScrollTimelineContext);
	const reduced = useReducedMotion();
	const progress = useEnterAnimationProgress(target, { root: containerRef });

	if (reduced) return null;
	return progress;
}
