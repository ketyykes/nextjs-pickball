import type { RefObject } from "react";
import { useScroll } from "motion/react";
import type { MotionValue } from "motion/react";

// 包裝 motion useScroll，預設 offset 為 stage 「進入過程」 0 → 「snap 停留」 1。
// 回傳 0→1 之間的 MotionValue，子元件可再以 useTransform 映射到任意視覺屬性。
// 此 offset 配合 /tour 的 snap-mandatory：動畫在 stage 進場 transition 期間發生，
// 使用者 snap 停留時看到終點狀態；如此 counter 可從起點跑到終點且使用者能看完整。
// 若 stage 位於某個內部 scroll container（例如 /tour 的 main），需傳入 container ref，
// 否則 useScroll 預設只追蹤 window，對內部捲動無感、scrollYProgress 永遠停在初值。
export function useScrollLinkedProgress(
	target: RefObject<HTMLElement | null>,
	container?: RefObject<HTMLElement | null>,
): MotionValue<number> {
	const { scrollYProgress } = useScroll({
		target,
		container,
		offset: ["start end", "start start"],
	});

	return scrollYProgress;
}
