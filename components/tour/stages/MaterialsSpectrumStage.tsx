"use client";

import { useRef } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { TourStage } from "@/components/tour/TourStage";
import { useStageProgress } from "@/components/tour/shared/ScrollTimelineProvider";

// stage 5：球拍材質。三張卡片水平 pin 推移，由 useTransform 控制 x 位置。
const cards = [
	{ id: "fiberglass", name: "玻纖", color: "#a3e635", desc: "便宜、耐打、力道大" },
	{ id: "carbon", name: "碳纖", color: "#fb923c", desc: "靈敏、控球佳、價位中高" },
	{ id: "kevlar", name: "凱夫拉", color: "#facc15", desc: "強度極高、進階首選" },
] as const;

export function MaterialsSpectrumStage() {
	const ref = useRef<HTMLElement>(null);
	const progress = useStageProgress(ref);

	// fallback motion value 讓 useTransform 永遠拿到合法 MotionValue。
	const fallback = useMotionValue(0);
	const source = progress ?? fallback;

	const x = useTransform(source, [0, 1], ["0%", "-66.66%"]);

	return (
		<TourStage id="materials-spectrum" ariaLabel="球拍材質光譜" stageRef={ref}>
			<div className="flex h-full w-full flex-col items-center justify-center gap-12 overflow-hidden bg-slate-900 text-white">
				<h2 className="text-center text-[clamp(2rem,5vw,4rem)] font-black">
					球拍<span className="text-lime-400">材質光譜</span>
				</h2>

				<motion.div
					className={
						progress
							? "flex w-[300%] gap-6 px-[5vw]"
							: "flex w-[300%] gap-6 px-[5vw] animate-stage-pin animation-timeline-view animation-range-cover"
					}
					style={progress ? { x } : undefined}
				>
					{cards.map((card) => (
						<div
							key={card.id}
							className="flex h-[300px] w-1/3 flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-slate-800 p-8"
							style={{ borderColor: card.color }}
						>
							<div className="font-bebas text-5xl" style={{ color: card.color }}>
								{card.name}
							</div>
							<div className="text-center text-sm text-white/70">{card.desc}</div>
						</div>
					))}
				</motion.div>
			</div>
		</TourStage>
	);
}
