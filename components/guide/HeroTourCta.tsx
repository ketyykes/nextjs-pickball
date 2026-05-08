"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Hero 末段的 CTA 按鈕：點擊觸發「nav-forward」view transition 並導向 /tour。
// 進場由父層 Hero 的 scroll-driven motion 控制 opacity/y（不再帶獨立 section 樣式）。
export function HeroTourCta() {
	const router = useRouter();

	const onClick = () => {
		router.push("/tour", { transitionTypes: ["nav-forward"] });
	};

	return (
		<div className="flex flex-col items-center gap-3">
			<p className="text-sm tracking-wider text-white/60">
				想用「動」的方式快速看完？
			</p>
			<Button
				type="button"
				onClick={onClick}
				className="bg-lime-400 text-slate-900 hover:bg-lime-300"
			>
				進入完整體驗 →
			</Button>
		</div>
	);
}
