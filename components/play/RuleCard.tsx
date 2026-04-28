// components/play/RuleCard.tsx
"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RULE_CARDS } from "@/data/play/ruleCards";

interface RuleCardProps {
	visible: boolean;
	onClose: () => void;
}

export function RuleCard({ visible, onClose }: RuleCardProps) {
	useEffect(() => {
		if (!visible) return;
		const id = window.setTimeout(onClose, 2000);
		return () => window.clearTimeout(id);
	}, [visible, onClose]);

	if (!visible) return null;
	const card = RULE_CARDS[0];
	return (
		<div
			data-testid="rule-card-kitchen"
			className="absolute inset-x-4 top-20 z-30 mx-auto max-w-sm"
		>
			<Card className="border-orange-400 bg-white">
				<CardContent className="p-4">
					<h3 className="mb-2 text-base font-bold text-orange-600">
						{card.title}
					</h3>
					<p className="text-sm text-slate-700">{card.body}</p>
				</CardContent>
			</Card>
		</div>
	);
}
