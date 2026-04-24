"use client";

import { useFadeInOnView } from "@/hooks/useFadeInOnView";
import { cn } from "@/lib/utils";

interface PartDividerProps {
	num: string;
	title: string;
}

// 對應原型 .part-divider：大數字 + 標題 + lime 短橫，含 scroll fade-in。
export function PartDivider({ num, title }: PartDividerProps) {
	const { ref, isVisible } = useFadeInOnView<HTMLDivElement>();

	return (
		<div
			ref={ref}
			className={cn(
				"relative px-8 py-20 text-center transition-all duration-700 ease-out",
				isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
			)}
		>
			<div className="relative font-bebas text-[clamp(5rem,12vw,10rem)] leading-[0.9] text-border">
				{num}
			</div>
			<h2 className="relative -mt-6 text-[clamp(1.6rem,3.5vw,2.4rem)] font-black text-slate-900">
				{title}
			</h2>
			<div className="mx-auto mt-6 h-1 w-16 rounded-sm bg-lime-400" />
		</div>
	);
}
