"use client";

import {
	createContext,
	useContext,
	useState,
	type ReactNode,
	type RefObject,
} from "react";
import type { MotionValue } from "motion/react";
import { supportsScrollTimeline } from "@/lib/scrollTimeline";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useScrollLinkedProgress } from "@/hooks/useScrollLinkedProgress";

const ScrollTimelineContext = createContext<boolean>(false);

// 於 /tour 入口掛一次：偵測 CSS scroll-timeline 支援，全頁子元件透過 context 共享結果。
// 使用 useState lazy initializer 於首次 render 同步偵測，避免 effect 內 setState 造成串連 render；
// SSR 時 supportsScrollTimeline 會回 false（CSS 物件不存在），client 首次 render 立即取得正確值。
export function ScrollTimelineProvider({ children }: { children: ReactNode }) {
	const [supported] = useState<boolean>(() => supportsScrollTimeline());

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
