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
	bouncedAt: number | null;
}

const PADDLE_RADIUS = 28;
const BALL_RADIUS = 10;
// 球場視覺常數：網位於玩家側 Kitchen 上緣（y=600），玩家中線在 x=300
const NET_Y = KITCHEN_BOUNDS.top;
const COURT_MID_X = (COURT_BOUNDS.left + COURT_BOUNDS.right) / 2;
// AI 側「對應 Kitchen」鏡像：以網為基準，與玩家側 Kitchen 等寬
const AI_KITCHEN_TOP =
	NET_Y - (KITCHEN_BOUNDS.bottom - KITCHEN_BOUNDS.top);

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
	// 對角發球：true = AI 從左半發、落玩家右半；false = 反之。每球後切換
	const serveFromLeftRef = useRef(true);

	// === 工具：發球（對角線：AI 與落點分屬不同半場） ===
	const spawnBall = useCallback(() => {
		const fromLeft = serveFromLeftRef.current;
		const isKitchenLanding =
			Math.random() < DEFAULT_DIFFICULTY.kitchenLandingProbability;
		const landingY = isKitchenLanding
			? randInRange(KITCHEN_BOUNDS.top + 10, KITCHEN_BOUNDS.bottom - 10)
			: randInRange(KITCHEN_BOUNDS.bottom + 10, COURT_BOUNDS.bottom - 30);
		// AI 起點與落點分屬左右半，形成對角線
		const startX = fromLeft
			? randInRange(COURT_BOUNDS.left + 60, COURT_MID_X - 60)
			: randInRange(COURT_MID_X + 60, COURT_BOUNDS.right - 60);
		const landingX = fromLeft
			? randInRange(COURT_MID_X + 20, COURT_BOUNDS.right - 30)
			: randInRange(COURT_BOUNDS.left + 30, COURT_MID_X - 20);
		ballRef.current = {
			start: { x: startX, y: 30 },
			end: { x: landingX, y: landingY },
			peakHeight: 220,
			spawnedAt: performance.now(),
			durationMs: 1200,
			hasBounced: false,
			bouncedAt: null,
		};
		serveFromLeftRef.current = !fromLeft;
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

		// 玩家側 Kitchen 區域高亮（綠）
		ctx.fillStyle = "rgba(163,230,53,0.22)";
		ctx.fillRect(
			KITCHEN_BOUNDS.left * sx,
			KITCHEN_BOUNDS.top * sy,
			(KITCHEN_BOUNDS.right - KITCHEN_BOUNDS.left) * sx,
			(KITCHEN_BOUNDS.bottom - KITCHEN_BOUNDS.top) * sy,
		);
		// AI 側 Kitchen 鏡像（淡橘，視覺對稱）
		ctx.fillStyle = "rgba(249,115,22,0.12)";
		ctx.fillRect(
			KITCHEN_BOUNDS.left * sx,
			AI_KITCHEN_TOP * sy,
			(KITCHEN_BOUNDS.right - KITCHEN_BOUNDS.left) * sx,
			(NET_Y - AI_KITCHEN_TOP) * sy,
		);

		// 球場外框
		ctx.strokeStyle = "rgba(255,255,255,0.6)";
		ctx.lineWidth = Math.max(2, 2 * Math.min(sx, sy));
		ctx.strokeRect(0, 0, COURT_BOUNDS.right * sx, COURT_BOUNDS.bottom * sy);

		// 網（橫線）：在 NET_Y 處粗白線，營造分隔感
		ctx.strokeStyle = "rgba(255,255,255,0.85)";
		ctx.lineWidth = Math.max(3, 3 * Math.min(sx, sy));
		ctx.beginPath();
		ctx.moveTo(0, NET_Y * sy);
		ctx.lineTo(COURT_BOUNDS.right * sx, NET_Y * sy);
		ctx.stroke();

		// Kitchen 邊界線（玩家側 + AI 側）
		ctx.strokeStyle = "rgba(255,255,255,0.55)";
		ctx.lineWidth = Math.max(2, 2 * Math.min(sx, sy));
		ctx.beginPath();
		ctx.moveTo(0, KITCHEN_BOUNDS.bottom * sy);
		ctx.lineTo(COURT_BOUNDS.right * sx, KITCHEN_BOUNDS.bottom * sy);
		ctx.moveTo(0, AI_KITCHEN_TOP * sy);
		ctx.lineTo(COURT_BOUNDS.right * sx, AI_KITCHEN_TOP * sy);
		ctx.stroke();

		// 中線（垂直）：分左右服務區，從 baseline 到 Kitchen 線（不穿越 Kitchen）
		ctx.beginPath();
		// 玩家側中線：Kitchen 下緣 → 玩家底線
		ctx.moveTo(COURT_MID_X * sx, KITCHEN_BOUNDS.bottom * sy);
		ctx.lineTo(COURT_MID_X * sx, COURT_BOUNDS.bottom * sy);
		// AI 側中線：AI 底線 → AI Kitchen 上緣
		ctx.moveTo(COURT_MID_X * sx, COURT_BOUNDS.top * sy);
		ctx.lineTo(COURT_MID_X * sx, AI_KITCHEN_TOP * sy);
		ctx.stroke();

		// 球
		const ball = ballRef.current;
		if (ball) {
			let pos: { x: number; y: number; height: number };
			if (ball.hasBounced && ball.bouncedAt !== null) {
				// 落地後：在落點原地彈跳，高度依 bouncePeakHeight 衰減
				const elapsed = performance.now() - ball.bouncedAt;
				const bounceT = clamp01(elapsed / DEFAULT_DIFFICULTY.bounceDurationMs);
				const height =
					4 *
					DEFAULT_DIFFICULTY.bouncePeakHeight *
					bounceT *
					(1 - bounceT);
				pos = { x: ball.end.x, y: ball.end.y, height };
			} else {
				// 空中飛行：拋物線插值
				const t = clamp01(
					(performance.now() - ball.spawnedAt) / ball.durationMs,
				);
				pos = interpolateBall(
					ball.start,
					ball.end,
					ball.peakHeight,
					t,
				);
			}
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
			// 球落地：t 過 1 第一次 → 標記 hasBounced 並記錄落地時刻（用於彈跳動畫）
			const ball = ballRef.current;
			if (ball && !ball.hasBounced) {
				const t = (performance.now() - ball.spawnedAt) / ball.durationMs;
				if (t >= 1) {
					ball.hasBounced = true;
					ball.bouncedAt = performance.now();
				}
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
