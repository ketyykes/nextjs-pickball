"use client";

import { useRef } from "react";
import { ChevronDown } from "lucide-react";
import { motion, useTransform, type Variants } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useScrollLinkedProgress } from "@/hooks/useScrollLinkedProgress";
import { useScrollTimelineSupport } from "@/components/tour/shared/ScrollTimelineProvider";
import { HeroTourCta } from "@/components/guide/HeroTourCta";

interface HeroStat {
	num: string;
	label: string;
}

const heroStats: readonly HeroStat[] = [
	{ num: "14萬+", label: "台灣活躍玩家" },
	{ num: "¼", label: "僅網球場 1/4 大" },
	{ num: "11", label: "分即可拿下一局" },
] as const;

// 父層 stagger：第一個元素延遲 0.2s 進場，後續每 0.2s 出一個。（reduced-motion fallback）
const heroContainerVariants: Variants = {
	hidden: {},
	show: {
		transition: { staggerChildren: 0.2, delayChildren: 0.2 },
	},
};

// 子層 fadeUp：對齊原 @keyframes fadeUp（translateY 30px、duration 0.8s、ease-out）。（reduced-motion fallback）
const heroItemVariants: Variants = {
	hidden: { opacity: 0, y: 30 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.8, ease: "easeOut" },
	},
};

// Hero 三分支（與 useStageProgress 對稱）：
//   1. reduced-motion = true → 既有 staggerChildren fallback（不掛 scroll-driven）
//   2. supportsScrollTimeline = true → CSS scroll-timeline 接管（本元件不需做事）
//   3. 其餘 → motion useTransform 驅動 scroll-driven 入場
export function Hero() {
	const sectionRef = useRef<HTMLElement>(null);
	const reduced = useReducedMotion();
	const supported = useScrollTimelineSupport();
	const progress = useScrollLinkedProgress(sectionRef);

	// useTransform 的 source 必須是 MotionValue（progress 來自 useScrollLinkedProgress 必有值）。
	// 非 reduced-motion 且 scroll-timeline 不支援時才把這些 motion value 套到 style。
	const titleY = useTransform(progress, [0, 0.3], [0, -40]);
	const titleScale = useTransform(progress, [0, 0.3], [1, 0.92]);
	const statsOpacity = useTransform(progress, [0.6, 0.9], [0, 1]);
	const statsY = useTransform(progress, [0.6, 0.9], [40, 0]);
	const ctaOpacity = useTransform(progress, [0.85, 1], [0, 1]);
	const ctaY = useTransform(progress, [0.85, 1], [20, 0]);

	const useScrollDriven = !reduced && !supported;

	return (
		<section
			ref={sectionRef}
			className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900"
		>
			{/* 背景光暈 */}
			<div
				aria-hidden
				className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(163,230,53,0.15)_0%,transparent_50%),radial-gradient(ellipse_at_80%_20%,rgba(249,115,22,0.1)_0%,transparent_50%)]"
			/>

			{/* 透視場地 */}
			<div
				aria-hidden
				className="absolute top-1/2 left-1/2 h-[700px] w-[340px] border-[3px] border-white/12 opacity-30 [transform:translate(-50%,-50%)_perspective(800px)_rotateX(55deg)_rotateZ(-5deg)] max-md:h-[500px] max-md:w-[240px]"
			>
				<div className="absolute top-0 right-0 left-0 h-[35%] border-b-[3px] border-white/12" />
				<div className="absolute top-[35%] left-1/2 h-[65%] w-0 border-l-[3px] border-white/12" />
			</div>

			{/* 浮球 */}
			<div
				aria-hidden
				className="absolute top-[15%] right-[12%] h-[60px] w-[60px] animate-float-ball rounded-full bg-lime-400 shadow-[0_0_60px_rgba(163,230,53,0.4)] max-md:top-[10%] max-md:right-[8%] max-md:h-10 max-md:w-10"
			>
				<div className="absolute inset-2 rounded-full border-2 border-dashed border-black/15" />
			</div>

			{/* 主內容 */}
			<motion.div
				className="relative z-[2] max-w-[900px] px-8 text-center"
				variants={heroContainerVariants}
				initial="hidden"
				animate="show"
				style={useScrollDriven ? { y: titleY, scale: titleScale } : undefined}
			>
				<motion.div
					variants={heroItemVariants}
					className="mb-8 inline-block rounded-full bg-lime-400 px-6 py-2 font-outfit text-xs font-bold uppercase tracking-[3px] text-slate-900"
				>
					2025 完全入門指南
				</motion.div>

				<motion.h1
					variants={heroItemVariants}
					className="mb-6 text-[clamp(2.4rem,6vw,4.5rem)] font-black leading-[1.2] text-white"
				>
					匹克球<span className="text-lime-400">新手</span>完全入門
				</motion.h1>

				<motion.p
					variants={heroItemVariants}
					className="mx-auto mb-10 max-w-[600px] text-[1.15rem] font-light text-white/70"
				>
					從規則到球拍選購，零基礎也能一次看懂的匹克球百科
				</motion.p>

				<motion.div
					className="mb-10 flex flex-wrap justify-center gap-12 max-md:gap-6"
					variants={heroItemVariants}
					style={
						useScrollDriven ? { opacity: statsOpacity, y: statsY } : undefined
					}
				>
					{heroStats.map((stat) => (
						<div key={stat.label} className="text-center">
							<div className="font-bebas text-5xl leading-none text-lime-400 max-md:text-[2.2rem]">
								{stat.num}
							</div>
							<div className="text-xs tracking-wide text-white/50">
								{stat.label}
							</div>
						</div>
					))}
				</motion.div>

				{/* Hero 末段 CTA：scroll 進度約 90% 浮現（spec scenario 1） */}
				<motion.div
					variants={heroItemVariants}
					style={
						useScrollDriven ? { opacity: ctaOpacity, y: ctaY } : undefined
					}
				>
					<HeroTourCta />
				</motion.div>
			</motion.div>

			{/* scroll indicator */}
			<div
				aria-hidden
				className="absolute bottom-8 left-1/2 z-[2] -translate-x-1/2 animate-bounce-down"
			>
				<ChevronDown className="h-7 w-7 stroke-white/30" strokeWidth={2} />
			</div>
		</section>
	);
}
