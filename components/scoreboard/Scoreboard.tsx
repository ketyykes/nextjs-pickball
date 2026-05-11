// components/scoreboard/Scoreboard.tsx
"use client";

import { useScoreboardStore } from "@/hooks/useScoreboardStore";
import { useOrientation } from "@/hooks/useOrientation";
import { useFullscreen } from "@/hooks/useFullscreen";
import { ScoreboardSetup } from "@/components/scoreboard/ScoreboardSetup";
import { TeamPanel } from "@/components/scoreboard/TeamPanel";
import { ActionBar } from "@/components/scoreboard/ActionBar";
import { OrientationHint } from "@/components/scoreboard/OrientationHint";
import { GameOverDialog } from "@/components/scoreboard/GameOverDialog";
import { cn } from "@/lib/utils";

// 計分器主容器：組合所有子元件，依 orientation 切換橫/直式排版
export function Scoreboard() {
	const [state, dispatch] = useScoreboardStore();
	const orientation = useOrientation();
	const { isSupported, isFullscreen, toggle } = useFullscreen();

	const locked = state.status !== "setup";
	const buttonsDisabled = state.status === "finished";
	const isLandscape = orientation === "landscape";

	return (
		<div className="flex min-h-screen flex-col bg-background pt-14">
			<OrientationHint visible={!isLandscape} />
			<ScoreboardSetup
				mode={state.mode}
				firstServer={state.firstServer}
				locked={locked}
				fullscreenSupported={isSupported}
				isFullscreen={isFullscreen}
				onModeChange={(mode) => dispatch({ type: "SET_MODE", mode })}
				onFirstServerChange={(team) => dispatch({ type: "SET_FIRST_SERVER", team })}
				onToggleFullscreen={toggle}
			/>
			<div
				className={cn(
					"flex flex-1",
					isLandscape ? "flex-row divide-x" : "flex-col divide-y",
					"divide-border",
				)}
			>
				<TeamPanel
					team="us"
					label="我方"
					state={state}
					disabled={buttonsDisabled}
					onWinRally={() => dispatch({ type: "RALLY_WON", winner: "us" })}
				/>
				<TeamPanel
					team="them"
					label="對方"
					state={state}
					disabled={buttonsDisabled}
					onWinRally={() => dispatch({ type: "RALLY_WON", winner: "them" })}
				/>
			</div>
			<ActionBar
				canUndo={state.history.length > 0}
				onUndo={() => dispatch({ type: "UNDO" })}
				onReset={() => dispatch({ type: "RESET" })}
			/>
			<GameOverDialog state={state} onPlayAgain={() => dispatch({ type: "RESET" })} />
		</div>
	);
}
