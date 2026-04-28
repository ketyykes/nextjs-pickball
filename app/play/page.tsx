import type { Metadata } from "next";
import { GameCanvas } from "@/components/play/GameCanvas";

export const metadata: Metadata = {
	title: "Kitchen 規則訓練 — 匹克球新手完全入門",
	description:
		"以小遊戲方式練習匹克球 Non-Volley Zone（Kitchen）規則：球落 Kitchen 內必須等彈一次再打。",
};

export default function PlayPage() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-6">
			<div className="w-full max-w-md">
				<GameCanvas />
			</div>
		</main>
	);
}
