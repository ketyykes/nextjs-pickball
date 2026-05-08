"use client";

import { useRef } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { TourStage } from "@/components/tour/TourStage";
import { useStageProgress } from "@/components/tour/shared/ScrollTimelineProvider";
import { playerGrowth } from "@/data/tour/playerGrowth";

// stage 2：年度成長折線圖。捲動 0→1 期間，折線 pathLength 從 0 補到 1。
export function PlayerGrowthStage() {
	const ref = useRef<HTMLElement>(null);
	const progress = useStageProgress(ref);

	// fallback motion value 讓 useTransform 永遠拿到合法 MotionValue。
	const fallback = useMotionValue(0);
	const source = progress ?? fallback;

	const maxPlayers = playerGrowth.at(-1)?.players ?? 1;
	const points = playerGrowth
		.map((d, i) => {
			const x = (i / (playerGrowth.length - 1)) * 560 + 20;
			const y = 280 - (d.players / maxPlayers) * 240;
			return `${x},${y}`;
		})
		.join(" ");

	const pathLength = useTransform(source, [0, 1], [0, 1]);

	return (
		<TourStage id="player-growth" ariaLabel="14 萬人正在打" stageRef={ref}>
			<div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
				<div className="flex flex-col items-center gap-12">
					<h2 className="text-center text-[clamp(2rem,5vw,4rem)] font-black">
						<span className="text-lime-400">14 萬</span>人正在打
					</h2>

					<svg viewBox="0 0 600 300" className="h-[300px] w-[600px] max-md:h-[200px] max-md:w-[360px]">
						<motion.polyline
							points={points}
							fill="none"
							stroke="#a3e635"
							strokeWidth="3"
							pathLength={progress ? pathLength : 1}
							className={
								progress
									? undefined
									: "animate-stage-fade animation-timeline-view animation-range-cover"
							}
						/>
						{playerGrowth.map((d, i) => {
							const x = (i / (playerGrowth.length - 1)) * 560 + 20;
							const y = 280 - (d.players / maxPlayers) * 240;
							return (
								<circle key={d.year} cx={x} cy={y} r="5" fill="#a3e635" />
							);
						})}
					</svg>

					<div className="grid grid-cols-6 gap-4 font-bebas text-2xl text-white/70">
						{playerGrowth.map((d) => (
							<div key={d.year} className="text-center">
								<div>{d.year}</div>
								<div className="text-xs text-white/40">
									{(d.players / 1000).toFixed(0)}k
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</TourStage>
	);
}
