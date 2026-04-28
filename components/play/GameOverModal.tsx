// components/play/GameOverModal.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GameOverModalProps {
	visible: boolean;
	score: number;
	bestCombo: number;
	onRestart: () => void;
}

export function GameOverModal({
	visible,
	score,
	bestCombo,
	onRestart,
}: GameOverModalProps) {
	if (!visible) return null;
	return (
		<div
			data-testid="game-over-modal"
			className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/80 p-4"
		>
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>結算</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 text-center">
					<div>
						<div className="font-bebas text-5xl">{score}</div>
						<div className="text-sm text-muted-foreground">總分</div>
						<div className="mt-2 text-sm text-muted-foreground">
							最高連擊 x{bestCombo}
						</div>
					</div>
					<Button data-testid="restart-button" onClick={onRestart}>
						再玩一次
					</Button>
					<Link
						href="/#kitchen"
						className="text-sm text-emerald-700 underline"
					>
						查看 Kitchen 規則詳細說明
					</Link>
				</CardContent>
			</Card>
		</div>
	);
}
