// components/play/HUD.tsx
interface HUDProps {
	score: number;
	lives: number;
	combo: number;
}

export function HUD({ score, lives, combo }: HUDProps) {
	return (
		<div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4 text-white">
			<div data-testid="hud-score" className="font-bebas text-2xl">
				分數 {score}
			</div>
			<div
				data-testid="hud-combo"
				className="font-bebas text-xl text-lime-400"
			>
				x{combo}
			</div>
			<div data-testid="hud-lives" className="font-bebas text-2xl">
				{Array.from({ length: lives }, () => "❤").join(" ")}
			</div>
		</div>
	);
}
