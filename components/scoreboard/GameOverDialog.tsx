// components/scoreboard/GameOverDialog.tsx
"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ScoreboardState } from "@/lib/scoreboard/types";

interface GameOverDialogProps {
	state: ScoreboardState;
	onPlayAgain: () => void;
}

// 比賽結束時自動開啟；提供「再來一局」與「關閉」。
// 「關閉」以 dismissedAtStatus 記錄被關閉時的 status；
// status 不再是 "finished" 後（例如 RESET），下次進入 "finished" 時 dialog 會自動重開。
export function GameOverDialog({ state, onPlayAgain }: GameOverDialogProps) {
	// null 表示尚未關閉；存入被關閉時的 status 讓 open 計算式自動 reset
	const [dismissedAtStatus, setDismissedAtStatus] = useState<string | null>(null);

	// 只在目前 status 與被關閉時相同才視為 dismissed，避免需要 effect 來 reset
	const dismissed = dismissedAtStatus === state.status;
	const open = state.status === "finished" && !dismissed;
	const winnerLabel = state.winner === "us" ? "我方獲勝" : "對方獲勝";

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o) setDismissedAtStatus(state.status);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>🏆 {winnerLabel}</DialogTitle>
					<DialogDescription>
						{state.scores.us} – {state.scores.them}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => setDismissedAtStatus(state.status)}>
						關閉
					</Button>
					<Button
						onClick={() => {
							setDismissedAtStatus(null);
							onPlayAgain();
						}}
					>
						再來一局
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
