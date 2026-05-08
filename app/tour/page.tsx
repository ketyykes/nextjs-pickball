import type { Metadata } from "next";
import { ScrollTimelineProvider } from "@/components/tour/shared/ScrollTimelineProvider";
import { TourProgressRail } from "@/components/tour/TourProgressRail";
import { TourSkipButton } from "@/components/tour/TourSkipButton";
import { CourtSizeStage } from "@/components/tour/stages/CourtSizeStage";
import { PlayerGrowthStage } from "@/components/tour/stages/PlayerGrowthStage";
import { TwoBounceStage } from "@/components/tour/stages/TwoBounceStage";
import { KitchenViolationStage } from "@/components/tour/stages/KitchenViolationStage";
import { MaterialsSpectrumStage } from "@/components/tour/stages/MaterialsSpectrumStage";
import { ClosingStage } from "@/components/tour/stages/ClosingStage";

export const metadata: Metadata = {
	title: "匹克球新手完全入門 · 互動體驗 | 匹克球指南",
	description: "用捲動的方式快速看完匹克球規則與器材重點，6 個互動場景帶你 5 分鐘上手",
};

export default function TourPage() {
	return (
		<ScrollTimelineProvider>
			<TourProgressRail />
			<TourSkipButton />
			<main className="h-screen snap-y snap-mandatory overflow-y-scroll bg-slate-900 text-white">
				<CourtSizeStage />
				<PlayerGrowthStage />
				<TwoBounceStage />
				<KitchenViolationStage />
				<MaterialsSpectrumStage />
				<ClosingStage />
			</main>
		</ScrollTimelineProvider>
	);
}
