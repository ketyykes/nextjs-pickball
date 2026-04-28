// components/play/PauseOverlay.tsx
"use client";

import { Button } from "@/components/ui/button";

interface PauseOverlayProps {
	visible: boolean;
	onResume: () => void;
}

export function PauseOverlay({ visible, onResume }: PauseOverlayProps) {
	if (!visible) return null;
	return (
		<div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/70">
			<Button data-testid="resume-button" onClick={onResume}>
				繼續
			</Button>
		</div>
	);
}
