import type { RefObject } from "react";
import { useScroll } from "motion/react";
import type { MotionValue } from "motion/react";

// 包裝 motion useScroll，預設 offset 為 stage 進入到完全離開視窗。
// 回傳 0→1 之間的 MotionValue，子元件可再以 useTransform 映射到任意視覺屬性。
export function useScrollLinkedProgress(
	target: RefObject<HTMLElement | null>,
): MotionValue<number> {
	const { scrollYProgress } = useScroll({
		target,
		offset: ["start end", "end start"],
	});

	return scrollYProgress;
}
