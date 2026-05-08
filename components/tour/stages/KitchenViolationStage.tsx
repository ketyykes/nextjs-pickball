"use client";

import { useRef } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { TourStage } from "@/components/tour/TourStage";
import { useStageProgress } from "@/components/tour/shared/ScrollTimelineProvider";

// stage 4：廚房違規。俯視場地，scroll 時廚房紅區從淡入到完整高亮，腳印由後場走向廚房。
export function KitchenViolationStage() {
	const ref = useRef<HTMLElement>(null);
	const progress = useStageProgress(ref);

	// fallback motion value 讓 useTransform 永遠拿到合法 MotionValue。
	const fallback = useMotionValue(0);
	const source = progress ?? fallback;

	const kitchenOpacity = useTransform(source, [0, 0.5], [0, 1]);
	const footY = useTransform(source, [0, 1], [240, 110]);
	const flashOpacity = useTransform(source, [0.85, 1], [0, 1]);

	return (
		<TourStage id="kitchen-violation" ariaLabel="廚房：腳一進去就犯規" stageRef={ref}>
			<div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
				<div className="flex flex-col items-center gap-12">
					<h2 className="text-center text-[clamp(2rem,5vw,4rem)] font-black">
						廚房：<span className="text-orange-500">腳一進去就犯規</span>
					</h2>

					<svg viewBox="0 0 400 300" className="h-[300px] w-[400px] max-md:h-[220px] max-md:w-[300px]">
						<rect x="20" y="20" width="360" height="260" fill="none" stroke="#a3e635" strokeWidth="3" />
						<motion.rect
							x="20"
							y="100"
							width="360"
							height="80"
							fill="#fb923c"
							style={progress ? { opacity: kitchenOpacity } : undefined}
							className={
								progress
									? undefined
									: "animate-stage-fade animation-timeline-view animation-range-cover"
							}
						/>
						<line x1="200" y1="20" x2="200" y2="100" stroke="#a3e635" strokeWidth="2" />
						<line x1="200" y1="180" x2="200" y2="280" stroke="#a3e635" strokeWidth="2" />
						<motion.circle
							r="8"
							cx="200"
							fill="white"
							cy={progress ? footY : 110}
						/>
						<motion.rect
							x="20"
							y="100"
							width="360"
							height="80"
							fill="#dc2626"
							style={progress ? { opacity: flashOpacity } : undefined}
						/>
					</svg>
				</div>
			</div>
		</TourStage>
	);
}
