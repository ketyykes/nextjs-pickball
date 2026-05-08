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
import { useScrollLinkedProgress } from "@/hooks/useScrollLinkedProgress";

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

// 統一抽象：reduced-motion 時回 null（讓 stage 走靜態 fallback class），
// 其餘情境回 motion value 供子元件以 useTransform 映射到視覺屬性。
// 改採「永遠走 motion」是因為 stage 元件的計數器、SVG morph 需要連續 motion value，
// CSS scroll-timeline 路徑無法驅動 React 文字節點變化。
export function useStageProgress(
	target: RefObject<HTMLElement | null>,
): MotionValue<number> | null {
	const { containerRef } = useContext(ScrollTimelineContext);
	const reduced = useReducedMotion();
	const progress = useScrollLinkedProgress(target, containerRef);

	if (reduced) return null;
	return progress;
}
