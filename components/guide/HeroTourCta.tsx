"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Hero 結束位置的 CTA：點擊觸發「nav-forward」view transition 並導向 /tour。
// transitionTypes 由 Next.js 16 router 串到 React 19 ViewTransition（task 10 已串接），
// pattern 與 components/tour/TourSkipButton、stages/ClosingStage 一致。
export function HeroTourCta() {
	const router = useRouter();

	const onClick = () => {
		router.push("/tour", { transitionTypes: ["nav-forward"] });
	};

	return (
		<section className="border-t border-white/5 bg-slate-950 py-12 text-center text-white">
			<p className="mb-4 text-sm tracking-wider text-white/60">
				想用「動」的方式快速看完？
			</p>
			<Button
				type="button"
				onClick={onClick}
				className="bg-lime-400 text-slate-900 hover:bg-lime-300"
			>
				進入完整體驗 →
			</Button>
		</section>
	);
}
