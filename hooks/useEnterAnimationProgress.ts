import { useEffect, type RefObject } from "react";
import {
	animate,
	useInView,
	useMotionValue,
	type MotionValue,
} from "motion/react";

interface Options {
	// 動畫從 0 跑到 1 的秒數，預設 1.5s
	duration?: number;
	// 進入 viewport 的觸發比例（IntersectionObserver threshold），預設 0.5
	amount?: number;
	// 是否只觸發一次，預設 true（一次性進場動畫）
	once?: boolean;
	// IntersectionObserver root；當 stage 在內部 scroll container（如 /tour 的 main）時必須提供
	root?: RefObject<Element | null>;
}

// 元素進入 viewport 時，啟動一次性的 0→1 motion 動畫；可作為 stage 進場動畫的進度來源。
// 配合 snap-mandatory layout 比 scroll-driven 直觀：使用者 snap 進入 stage，動畫立刻播放。
export function useEnterAnimationProgress(
	target: RefObject<Element | null>,
	options: Options = {},
): MotionValue<number> {
	const { duration = 1.5, amount = 0.5, once = true, root } = options;
	const progress = useMotionValue(0);
	const isInView = useInView(target, { once, amount, root });

	useEffect(() => {
		if (!isInView) return;
		const controls = animate(progress, 1, { duration, ease: "easeOut" });
		return () => controls.stop();
	}, [isInView, progress, duration]);

	return progress;
}
