// components/play/StartScreen.tsx
"use client";

import { Button } from "@/components/ui/button";
import { KITCHEN_RULE_TIP } from "@/data/play/ruleCards";

interface StartScreenProps {
	visible: boolean;
	onStart: () => void;
}

export function StartScreen({ visible, onStart }: StartScreenProps) {
	if (!visible) return null;
	return (
		<div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-slate-900/95 px-6 text-center text-white">
			<h2 className="text-3xl font-bold">Kitchen 規則訓練</h2>
			<p className="max-w-sm text-sm text-white/70">{KITCHEN_RULE_TIP}</p>
			<Button
				data-testid="play-start-button"
				size="lg"
				onClick={onStart}
				className="bg-lime-400 text-slate-900 hover:bg-lime-300"
			>
				開始
			</Button>
		</div>
	);
}
