"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useGameLoop } from "@/hooks/useGameLoop";
import { interpolateBall } from "@/lib/play/ball";
import { COURT_BOUNDS, KITCHEN_BOUNDS } from "@/lib/play/court";
import { judgeHit, judgeTimeout } from "@/lib/play/judge";
import { gameReducer, initialState } from "@/lib/play/state";
import type { Point } from "@/lib/play/types";
import { DEFAULT_DIFFICULTY } from "@/data/play/difficulty";
import { GameOverModal } from "./GameOverModal";
import { HUD } from "./HUD";
import { PauseOverlay } from "./PauseOverlay";
import { RuleCard } from "./RuleCard";
import { StartScreen } from "./StartScreen";

interface BallShot {
	start: Point;
	end: Point;
	peakHeight: number;
	spawnedAt: number;
	durationMs: number;
	hasBounced: boolean;
}

const PADDLE_RADIUS = 28;
const BALL_RADIUS = 10;

export function GameCanvas() {
	const containerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [state, dispatch] = useReducer(gameReducer, initialState);
	const [paddle, setPaddle] = useState<Point>({ x: 300, y: 880 });
	const [paused, setPaused] = useState(false);
	const [ruleCardVisible, setRuleCardVisible] = useState(false);
	const [bestCombo, setBestCombo] = useState(0);
	const ballRef = useRef<BallShot | null>(null);
	const elapsedSinceServeRef = useRef(0);
	const elapsedSinceAwaitRef = useRef(0);

	// === 工具：發球（useCallback 確保宣告先於使用點，且引用穩定） ===
	const spawnBall = useCallback(() => {
		const isKitchenLanding =
			Math.random() < DEFAULT_DIFFICULTY.kitchenLandingProbability;
		const landingY = isKitchenLanding
			? randInRange(KITCHEN_BOUNDS.top + 10, KITCHEN_BOUNDS.bottom - 10)
			: randInRange(KITCHEN_BOUNDS.bottom + 10, COURT_BOUNDS.bottom - 30);
		const landingX = randInRange(
			COURT_BOUNDS.left + 30,
			COURT_BOUNDS.right - 30,
		);
		ballRef.current = {
			start: { x: 300, y: 30 },
			end: { x: landingX, y: landingY },
			peakHeight: 220,
			spawnedAt: performance.now(),
			durationMs: 1200,
			hasBounced: false,
		};
	}, []);

	// === 工具：繪製 Canvas（依 paddle 變化重新生成；ballRef 為 ref 不影響） ===
	const drawScene = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const w = canvas.width;
		const h = canvas.height;
		const sx = w / COURT_BOUNDS.right;
		const sy = h / COURT_BOUNDS.bottom;

		ctx.clearRect(0, 0, w, h);
		// 球場底色
		ctx.fillStyle = "#0e3b2e";
		ctx.fillRect(0, 0, w, h);

		// Kitchen 區域高亮
		ctx.fillStyle = "rgba(163,230,53,0.2)";
		ctx.fillRect(
			KITCHEN_BOUNDS.left * sx,
			KITCHEN_BOUNDS.top * sy,
			(KITCHEN_BOUNDS.right - KITCHEN_BOUNDS.left) * sx,
			(KITCHEN_BOUNDS.bottom - KITCHEN_BOUNDS.top) * sy,
		);

		// 球場線
		ctx.strokeStyle = "rgba(255,255,255,0.6)";
		ctx.lineWidth = Math.max(2, 2 * Math.min(sx, sy));
		ctx.strokeRect(0, 0, COURT_BOUNDS.right * sx, COURT_BOUNDS.bottom * sy);
		// 網（中線）
		ctx.beginPath();
		ctx.moveTo(0, COURT_BOUNDS.bottom * 0.5 * sy);
		ctx.lineTo(COURT_BOUNDS.right * sx, COURT_BOUNDS.bottom * 0.5 * sy);
		ctx.stroke();
		// Kitchen 邊界線
		ctx.beginPath();
		ctx.moveTo(0, KITCHEN_BOUNDS.bottom * sy);
		ctx.lineTo(COURT_BOUNDS.right * sx, KITCHEN_BOUNDS.bottom * sy);
		ctx.stroke();

		// 球
		const ball = ballRef.current;
		if (ball) {
			const t = clamp01(
				(performance.now() - ball.spawnedAt) / ball.durationMs,
			);
			const tInner = t <= 1 ? t : Math.min(1, (t - 1) * 2.5);
			const pos = interpolateBall(
				ball.start,
				ball.end,
				ball.peakHeight,
				tInner,
			);
			const shadowAlpha = 0.5 - Math.min(0.4, pos.height / 600);
			// 影子
			ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
			ctx.beginPath();
			ctx.ellipse(
				pos.x * sx,
				pos.y * sy,
				BALL_RADIUS * sx,
				BALL_RADIUS * sy * 0.5,
				0,
				0,
				Math.PI * 2,
			);
			ctx.fill();
			// 球本體（高度愈高愈大）
			const radiusScale = 1 + pos.height / 240;
			ctx.fillStyle = "#fde047";
			ctx.beginPath();
			ctx.arc(
				pos.x * sx,
				(pos.y - pos.height) * sy,
				BALL_RADIUS * radiusScale * Math.min(sx, sy),
				0,
				Math.PI * 2,
			);
			ctx.fill();
		}

		// 球拍
		ctx.fillStyle = "rgba(248,250,252,0.95)";
		ctx.beginPath();
		ctx.arc(
			paddle.x * sx,
			paddle.y * sy,
			PADDLE_RADIUS * Math.min(sx, sy),
			0,
			Math.PI * 2,
		);
		ctx.fill();
		ctx.strokeStyle = "#0f172a";
		ctx.lineWidth = 2;
		ctx.stroke();
	}, [paddle]);

	const handleRuleCardClose = useCallback(() => setRuleCardVisible(false), []);

	// === 視窗縮放 ===
	useEffect(() => {
		const container = containerRef.current;
		const canvas = canvasRef.current;
		if (!container || !canvas) return;
		const updateSize = () => {
			const dpr = window.devicePixelRatio || 1;
			const { width, height } = container.getBoundingClientRect();
			canvas.width = Math.max(1, Math.floor(width * dpr));
			canvas.height = Math.max(1, Math.floor(height * dpr));
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
		};
		updateSize();
		const observer = new ResizeObserver(updateSize);
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	// === 發球：serving 立即發、next_ball 短暫延遲後發 ===
	useEffect(() => {
		if (state.status === "serving") {
			spawnBall();
			elapsedSinceServeRef.current = 0;
			elapsedSinceAwaitRef.current = 0;
			dispatch({ type: "BALL_LANDED" });
		}
		if (state.status === "next_ball") {
			const id = window.setTimeout(() => {
				spawnBall();
				elapsedSinceServeRef.current = 0;
				elapsedSinceAwaitRef.current = 0;
				dispatch({ type: "BALL_LANDED" });
			}, 600);
			return () => window.clearTimeout(id);
		}
	}, [state.status, spawnBall]);

	// === 主迴圈 ===
	const loopEnabled =
		!paused && state.status !== "idle" && state.status !== "game_over";

	useGameLoop(
		(dt) => {
			elapsedSinceAwaitRef.current += dt;
			elapsedSinceServeRef.current += dt;
			drawScene();
			// 球落地：t 過 1 第一次 → 標記 hasBounced
			const ball = ballRef.current;
			if (ball && !ball.hasBounced) {
				const t = (performance.now() - ball.spawnedAt) / ball.durationMs;
				if (t >= 1) ball.hasBounced = true;
			}
			// timeout 檢查
			if (state.status === "awaiting_input") {
				if (
					judgeTimeout(
						elapsedSinceAwaitRef.current,
						DEFAULT_DIFFICULTY.hitTimeoutMs,
					)
				) {
					dispatch({ type: "TIMEOUT" });
				}
			}
		},
		{ enabled: loopEnabled },
	);

	// === Pointer 處理 ===
	function getCourtPoint(e: React.PointerEvent<HTMLDivElement>): Point {
		const rect = e.currentTarget.getBoundingClientRect();
		const scaleX = COURT_BOUNDS.right / rect.width;
		const scaleY = COURT_BOUNDS.bottom / rect.height;
		return {
			x: (e.clientX - rect.left) * scaleX,
			y: (e.clientY - rect.top) * scaleY,
		};
	}

	function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
		setPaddle(getCourtPoint(e));
	}

	function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
		const point = getCourtPoint(e);
		setPaddle(point);
		const ball = ballRef.current;
		if (!ball) return;
		if (state.status !== "awaiting_input") return;
		const result = judgeHit({
			landingPoint: ball.end,
			ballState: ball.hasBounced ? "after_bounce" : "in_air",
			paddlePoint: point,
			toleranceRadius: DEFAULT_DIFFICULTY.toleranceRadius,
		});
		dispatch({ type: "PLAYER_HIT", result });
		// 在事件 handler（非 effect）內 setState：避免 react-hooks/set-state-in-effect
		if (result.kind === "violation_kitchen") {
			setRuleCardVisible(true);
		}
		if (result.kind === "legal") {
			const newCombo = state.combo + 1;
			setBestCombo((prev) => (newCombo > prev ? newCombo : prev));
		}
	}

	return (
		<div
			ref={containerRef}
			data-testid="game-canvas-container"
			className="relative h-full min-h-[600px] w-full overflow-hidden bg-emerald-950"
			style={{ touchAction: "none" }}
			onPointerMove={handlePointerMove}
			onPointerDown={handlePointerDown}
		>
			<canvas ref={canvasRef} className="block h-full w-full" />
			<HUD score={state.score} lives={state.lives} combo={state.combo} />
			<StartScreen
				visible={state.status === "idle"}
				onStart={() => dispatch({ type: "START" })}
			/>
			<RuleCard visible={ruleCardVisible} onClose={handleRuleCardClose} />
			<PauseOverlay visible={paused} onResume={() => setPaused(false)} />
			<GameOverModal
				visible={state.status === "game_over"}
				score={state.score}
				bestCombo={bestCombo}
				onRestart={() => dispatch({ type: "RESTART" })}
			/>
		</div>
	);
}

function randInRange(a: number, b: number): number {
	return a + Math.random() * (b - a);
}

function clamp01(v: number): number {
	return v < 0 ? 0 : v > 1 ? 1 : v;
}
