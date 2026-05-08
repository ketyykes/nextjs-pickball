"use client";

import { useRef } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { useRouter } from "next/navigation";
import { TourStage } from "@/components/tour/TourStage";
import { useStageProgress } from "@/components/tour/shared/ScrollTimelineProvider";
import { Button } from "@/components/ui/button";

// stage 6：收束 CTA。按鈕點擊時觸發 view transition「back」並回到 /。
// view transition 串接於 Task 10；本 task 先 router.push('/') 即可。
export function ClosingStage() {
	const ref = useRef<HTMLElement>(null);
	const progress = useStageProgress(ref);
	const router = useRouter();

	// fallback motion value 讓 useTransform 永遠拿到合法 MotionValue。
	const fallback = useMotionValue(0);
	const source = progress ?? fallback;

	const opacity = useTransform(source, [0.4, 1], [0, 1]);
	const y = useTransform(source, [0.4, 1], [40, 0]);

	const onBack = () => {
		router.push("/");
	};

	return (
		<TourStage id="closing" ariaLabel="準備好開始了嗎？" stageRef={ref}>
			<div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
				<motion.div
					className={
						progress
							? "flex flex-col items-center gap-8"
							: "flex flex-col items-center gap-8 animate-stage-fade animation-timeline-view animation-range-cover"
					}
					style={progress ? { opacity, y } : undefined}
				>
					<h2 className="text-center text-[clamp(2rem,5vw,4rem)] font-black">
						準備好<span className="text-lime-400">開始了嗎？</span>
					</h2>
					<Button onClick={onBack} className="bg-lime-400 text-slate-900 hover:bg-lime-300">
						回到完整指南
					</Button>
				</motion.div>
			</div>
		</TourStage>
	);
}
