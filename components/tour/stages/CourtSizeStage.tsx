"use client";

import { useRef } from "react";
import {
	motion,
	useMotionValue,
	useTransform,
	type MotionValue,
} from "motion/react";
import { TourStage } from "@/components/tour/TourStage";
import { useStageProgress } from "@/components/tour/shared/ScrollTimelineProvider";

// stage 1：球場大小對比。捲動進度 0→1 期間，網球場 SVG 縮小至 1/2，
// 並淡入匹克球場輪廓；計數器從 260 跑到 81。
export function CourtSizeStage() {
	const ref = useRef<HTMLElement>(null);
	const progress = useStageProgress(ref);

	// fallback motion value 讓 useTransform 永遠拿到合法 MotionValue；
	// 是否套用到 style 由 progress 是否存在決定。
	const fallback = useMotionValue(0);
	const source = progress ?? fallback;

	const courtScale = useTransform(source, [0, 1], [1, 0.5]);
	const pickleOpacity = useTransform(source, [0.3, 1], [0, 1]);
	const counter = useTransform(source, [0, 1], [260, 81]);

	return (
		<TourStage id="court-size" ariaLabel="比網球更小，但同樣激烈" stageRef={ref}>
			<div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
				<div className="flex flex-col items-center gap-12">
					<h2 className="text-center text-[clamp(2rem,5vw,4rem)] font-black">
						比網球更小，<span className="text-lime-400">但同樣激烈</span>
					</h2>

					<div className="relative h-[300px] w-[600px] max-md:h-[200px] max-md:w-[360px]">
						<motion.svg
							style={progress ? { scale: courtScale } : undefined}
							viewBox="0 0 600 300"
							className={
								progress
									? "absolute inset-0"
									: "absolute inset-0 animate-stage-fade animation-timeline-view animation-range-cover"
							}
						>
							<rect x="20" y="20" width="560" height="260" fill="none" stroke="#a3e635" strokeWidth="3" />
							<line x1="300" y1="20" x2="300" y2="280" stroke="#a3e635" strokeWidth="2" />
						</motion.svg>

						<motion.svg
							style={progress ? { opacity: pickleOpacity } : undefined}
							viewBox="0 0 600 300"
							className={
								progress
									? "absolute inset-0"
									: "absolute inset-0 animate-stage-fade animation-timeline-view animation-range-cover"
							}
						>
							<rect x="220" y="100" width="160" height="100" fill="none" stroke="#fb923c" strokeWidth="3" />
						</motion.svg>
					</div>

					<div className="flex items-baseline gap-4 font-bebas text-5xl">
						{progress ? <Counter value={counter} /> : <span style={{ color: "#fb923c" }}>81</span>}
						<span className="text-base text-white/60">㎡</span>
					</div>
				</div>
			</div>
		</TourStage>
	);
}

// 把 MotionValue<number> 轉為整數字串渲染
function Counter({ value }: { value: MotionValue<number> }) {
	const display = useTransform(value, (v) => Math.round(v).toString());
	return <motion.span style={{ color: "#fb923c" }}>{display}</motion.span>;
}
