"use client";

import { useRef } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { TourStage } from "@/components/tour/TourStage";
import { useStageProgress } from "@/components/tour/shared/ScrollTimelineProvider";

// stage 4：廚房違規。俯視匹克球場（縱向細長、中央橫向球網、球網兩側為廚房 NVZ）。
// 進場動畫：紅色廚房區淡入 → 腳印從後場走向廚房線 → 跨越廚房線時紅閃示警。
export function KitchenViolationStage() {
	const ref = useRef<HTMLElement>(null);
	const progress = useStageProgress(ref);

	const fallback = useMotionValue(0);
	const source = progress ?? fallback;

	const kitchenOpacity = useTransform(source, [0, 0.4], [0, 0.85]);
	// 腳從後場（cy=380）走到廚房邊（cy=325 即剛踩到下廚房線）
	const footCy = useTransform(source, [0.3, 0.85], [380, 325]);
	const flashOpacity = useTransform(source, [0.85, 1], [0, 0.55]);

	return (
		<TourStage id="kitchen-violation" ariaLabel="廚房：腳一進去就犯規" stageRef={ref}>
			<div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
				<div className="flex flex-col items-center gap-8">
					<h2 className="text-center text-[clamp(2rem,5vw,4rem)] font-black">
						廚房：<span className="text-orange-500">腳一進去就犯規</span>
					</h2>

					<svg
						viewBox="0 0 280 440"
						className="h-[420px] w-[280px] max-md:h-[320px] max-md:w-[210px]"
					>
						{/* 場地外框 */}
						<rect
							x="20"
							y="20"
							width="240"
							height="400"
							fill="none"
							stroke="#a3e635"
							strokeWidth="3"
						/>

						{/* 廚房紅區（球網上下各 80，總共 160 高、佔場地縱向 40%） */}
						<motion.rect
							x="20"
							y="160"
							width="240"
							height="160"
							fill="#fb923c"
							style={{ opacity: kitchenOpacity }}
						/>

						{/* 廚房線（橙虛線標示邊界） */}
						<line
							x1="20"
							y1="160"
							x2="260"
							y2="160"
							stroke="#fb923c"
							strokeWidth="2"
							strokeDasharray="6 4"
							opacity="0.9"
						/>
						<line
							x1="20"
							y1="320"
							x2="260"
							y2="320"
							stroke="#fb923c"
							strokeWidth="2"
							strokeDasharray="6 4"
							opacity="0.9"
						/>

						{/* 球網（橫向白色虛線、廚房正中央） */}
						<line
							x1="20"
							y1="240"
							x2="260"
							y2="240"
							stroke="white"
							strokeWidth="3"
							strokeDasharray="2 3"
						/>

						{/* 中線（廚房外的後場上下兩段，分隔左右發球區） */}
						<line
							x1="140"
							y1="20"
							x2="140"
							y2="160"
							stroke="#a3e635"
							strokeWidth="2"
						/>
						<line
							x1="140"
							y1="320"
							x2="140"
							y2="420"
							stroke="#a3e635"
							strokeWidth="2"
						/>

						{/* 標示文字 */}
						<text
							x="180"
							y="200"
							fill="white"
							fontSize="13"
							fontWeight="bold"
							fontFamily="sans-serif"
						>
							廚房 NVZ
						</text>
						<text
							x="265"
							y="244"
							fill="white"
							fontSize="11"
							fontFamily="sans-serif"
						>
							網
						</text>
						<text
							x="30"
							y="395"
							fill="#a3e635"
							fontSize="12"
							fontFamily="sans-serif"
						>
							後場
						</text>

						{/* 腳印（左右兩腳並排，cy 由 footCy 控制，從後場往廚房線走） */}
						<motion.circle cx="190" r="7" fill="white" cy={footCy} />
						<motion.circle cx="210" r="7" fill="white" cy={footCy} />

						{/* 紅閃覆蓋整個廚房（跨越廚房線時警示） */}
						<motion.rect
							x="20"
							y="160"
							width="240"
							height="160"
							fill="#dc2626"
							style={{ opacity: flashOpacity }}
						/>
					</svg>

					<p className="max-w-md text-center text-sm text-white/60">
						隨時都可以進入廚房，但站在裡面（包括踩到廚房線）
						<span className="text-orange-400">絕對不能截擊</span>
					</p>
				</div>
			</div>
		</TourStage>
	);
}
