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

const ScrollTimelineContext = createContext<boolean>(false);

// 偵測值不會於 runtime 變動，因此 subscribe 為 noop。
// useSyncExternalStore 的 server snapshot 永遠回 false，client snapshot 回實際偵測，
// React 會於 hydration 階段使用 server snapshot 對齊 SSR 結果，避免 hydration mismatch。
const subscribe = () => () => {};
const getClientSnapshot = () => supportsScrollTimeline();
const getServerSnapshot = () => false;

export function ScrollTimelineProvider({ children }: { children: ReactNode }) {
	const supported = useSyncExternalStore(
		subscribe,
		getClientSnapshot,
		getServerSnapshot,
	);

	return (
		<ScrollTimelineContext.Provider value={supported}>
			{children}
		</ScrollTimelineContext.Provider>
	);
}

export function useScrollTimelineSupport(): boolean {
	return useContext(ScrollTimelineContext);
}

// 統一抽象：支援 scroll-timeline 或 reduced-motion 時回 null（CSS 自跑或全靜態），
// 其餘情境回 motion value 供子元件以 useTransform 映射到視覺屬性。
export function useStageProgress(
	target: RefObject<HTMLElement | null>,
): MotionValue<number> | null {
	const reduced = useReducedMotion();
	const supported = useScrollTimelineSupport();
	const progress = useScrollLinkedProgress(target);

	if (reduced) return null;
	if (supported) return null;
	return progress;
}
