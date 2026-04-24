"use client";

import { ChevronDown } from "lucide-react";

interface HeroStat {
	num: string;
	label: string;
}

const heroStats: readonly HeroStat[] = [
	{ num: "14萬+", label: "台灣活躍玩家" },
	{ num: "¼", label: "僅網球場 1/4 大" },
	{ num: "11", label: "分即可拿下一局" },
] as const;

// 對應原型 .hero：深藍底 + 透視場地 + 浮球 + 主標題 + 三項統計。
export function Hero() {
	return (
		<section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900">
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
			<div className="relative z-[2] max-w-[900px] px-8 text-center">
				<div className="mb-8 inline-block animate-fade-up rounded-full bg-lime-400 px-6 py-2 font-outfit text-xs font-bold uppercase tracking-[3px] text-slate-900 [animation-delay:0.2s]">
					2025 完全入門指南
				</div>

				<h1 className="mb-6 animate-fade-up text-[clamp(2.4rem,6vw,4.5rem)] font-black leading-[1.2] text-white [animation-delay:0.4s]">
					匹克球<span className="text-lime-400">新手</span>完全入門
				</h1>

				<p className="mx-auto mb-10 max-w-[600px] animate-fade-up text-[1.15rem] font-light text-white/70 [animation-delay:0.6s]">
					從規則到球拍選購，零基礎也能一次看懂的匹克球百科
				</p>

				<div className="flex flex-wrap justify-center gap-12 animate-fade-up [animation-delay:0.8s] max-md:gap-6">
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
				</div>
			</div>

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
