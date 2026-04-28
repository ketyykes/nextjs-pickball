"use client";

import Matter from "matter-js";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useGameLoop } from "@/hooks/useGameLoop";
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

// === 物理／視覺常數 ===
const PADDLE_RADIUS = 28;
const BALL_RADIUS = 10;
const NET_Y = KITCHEN_BOUNDS.top;
const COURT_MID_X = (COURT_BOUNDS.left + COURT_BOUNDS.right) / 2;
const AI_KITCHEN_TOP =
	NET_Y - (KITCHEN_BOUNDS.bottom - KITCHEN_BOUNDS.top);
// 重力（court-units / sec²），決定球落下速度
const G_VERTICAL = 2400;
// 垂直回彈係數（每次彈起保留的能量比例）
const RESTITUTION = 0.55;
// 落地後水平方向阻尼（每次彈跳保留的水平速度比例）
const HORIZONTAL_DAMPING = 0.82;
// 達到此次數後球停止
const MAX_BOUNCES = 3;
// matter-js 速度的時間基準（每 step 的位移；預設 60Hz）
const PHYSICS_STEPS_PER_SEC = 60;
// 飛行時間（秒）
const FLIGHT_SEC = 1.0;

interface PhysicsBall {
	body: Matter.Body;
	z: number;
	vz: number;
	hasBounced: boolean;
	bounceCount: number;
	spawnedAt: number;
	endX: number;
	endY: number;
}

export function GameCanvas() {
	const containerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [state, dispatch] = useReducer(gameReducer, initialState);
	const [paddle, setPaddle] = useState<Point>({ x: 300, y: 880 });
	const [paused, setPaused] = useState(false);
	const [ruleCardVisible, setRuleCardVisible] = useState(false);
	const [bestCombo, setBestCombo] = useState(0);
	const engineRef = useRef<Matter.Engine | null>(null);
	const ballRef = useRef<PhysicsBall | null>(null);
	const elapsedSinceServeRef = useRef(0);
	const elapsedSinceAwaitRef = useRef(0);
	const serveFromLeftRef = useRef(true);

	// === matter-js 引擎生命週期 ===
	useEffect(() => {
		const engine = Matter.Engine.create({
			gravity: { x: 0, y: 0, scale: 0 }, // 2D 平面無重力（Z 由我們自己處理）
		});
		engineRef.current = engine;
		return () => {
			if (ballRef.current) {
				Matter.Composite.remove(engine.world, ballRef.current.body);
				ballRef.current = null;
			}
			Matter.Engine.clear(engine);
			engineRef.current = null;
		};
	}, []);

	// === 工具：發球（對角線；以真實物理計算速度） ===
	const spawnBall = useCallback(() => {
		const engine = engineRef.current;
		if (!engine) return;
		// 先移除前一顆球
		if (ballRef.current) {
			Matter.Composite.remove(engine.world, ballRef.current.body);
			ballRef.current = null;
		}

		const fromLeft = serveFromLeftRef.current;
		const isKitchenLanding =
			Math.random() < DEFAULT_DIFFICULTY.kitchenLandingProbability;
		const landingY = isKitchenLanding
			? randInRange(KITCHEN_BOUNDS.top + 10, KITCHEN_BOUNDS.bottom - 10)
			: randInRange(KITCHEN_BOUNDS.bottom + 10, COURT_BOUNDS.bottom - 30);
		const startX = fromLeft
			? randInRange(COURT_BOUNDS.left + 60, COURT_MID_X - 60)
			: randInRange(COURT_MID_X + 60, COURT_BOUNDS.right - 60);
		const landingX = fromLeft
			? randInRange(COURT_MID_X + 20, COURT_BOUNDS.right - 30)
			: randInRange(COURT_BOUNDS.left + 30, COURT_MID_X - 20);
		const startY = 30;

		const totalSteps = FLIGHT_SEC * PHYSICS_STEPS_PER_SEC;
		const body = Matter.Bodies.circle(startX, startY, BALL_RADIUS, {
			isSensor: true,
			frictionAir: 0,
			inertia: Number.POSITIVE_INFINITY,
		});
		Matter.Body.setVelocity(body, {
			x: (landingX - startX) / totalSteps,
			y: (landingY - startY) / totalSteps,
		});
		Matter.Composite.add(engine.world, body);

		// 初始垂直速度：z(t) = vz0*t - 0.5*G*t²，z(FLIGHT_SEC)=0 → vz0 = 0.5*G*FLIGHT_SEC
		const vz0 = 0.5 * G_VERTICAL * FLIGHT_SEC;

		ballRef.current = {
			body,
			z: 0,
			vz: vz0,
			hasBounced: false,
			bounceCount: 0,
			spawnedAt: performance.now(),
			endX: landingX,
			endY: landingY,
		};
		serveFromLeftRef.current = !fromLeft;
	}, []);

	// === 繪製 Canvas ===
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

		// 玩家側 Kitchen 區（強化視覺：飽和黃綠 + 對角條紋）
		const kx = KITCHEN_BOUNDS.left * sx;
		const ky = KITCHEN_BOUNDS.top * sy;
		const kw = (KITCHEN_BOUNDS.right - KITCHEN_BOUNDS.left) * sx;
		const kh = (KITCHEN_BOUNDS.bottom - KITCHEN_BOUNDS.top) * sy;
		ctx.fillStyle = "rgba(217,249,157,0.32)";
		ctx.fillRect(kx, ky, kw, kh);
		drawDiagonalStripes(
			ctx,
			kx,
			ky,
			kw,
			kh,
			"rgba(190,242,100,0.18)",
			14 * Math.min(sx, sy),
		);
		// AI 側 Kitchen 鏡像（淡橘）
		ctx.fillStyle = "rgba(249,115,22,0.14)";
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

		// 網（橫線）
		ctx.strokeStyle = "rgba(255,255,255,0.85)";
		ctx.lineWidth = Math.max(3, 3 * Math.min(sx, sy));
		ctx.beginPath();
		ctx.moveTo(0, NET_Y * sy);
		ctx.lineTo(COURT_BOUNDS.right * sx, NET_Y * sy);
		ctx.stroke();

		// Kitchen 邊界（玩家側用較粗的亮綠線，AI 側用一般白線）
		ctx.strokeStyle = "rgba(190,242,100,0.85)";
		ctx.lineWidth = Math.max(3, 3 * Math.min(sx, sy));
		ctx.setLineDash([10 * Math.min(sx, sy), 6 * Math.min(sx, sy)]);
		ctx.beginPath();
		ctx.moveTo(0, KITCHEN_BOUNDS.bottom * sy);
		ctx.lineTo(COURT_BOUNDS.right * sx, KITCHEN_BOUNDS.bottom * sy);
		ctx.stroke();
		ctx.setLineDash([]);
		ctx.strokeStyle = "rgba(255,255,255,0.55)";
		ctx.lineWidth = Math.max(2, 2 * Math.min(sx, sy));
		ctx.beginPath();
		ctx.moveTo(0, AI_KITCHEN_TOP * sy);
		ctx.lineTo(COURT_BOUNDS.right * sx, AI_KITCHEN_TOP * sy);
		ctx.stroke();

		// 中線（垂直，不穿越 Kitchen）
		ctx.strokeStyle = "rgba(255,255,255,0.55)";
		ctx.beginPath();
		ctx.moveTo(COURT_MID_X * sx, KITCHEN_BOUNDS.bottom * sy);
		ctx.lineTo(COURT_MID_X * sx, COURT_BOUNDS.bottom * sy);
		ctx.moveTo(COURT_MID_X * sx, COURT_BOUNDS.top * sy);
		ctx.lineTo(COURT_MID_X * sx, AI_KITCHEN_TOP * sy);
		ctx.stroke();

		// Kitchen 標籤
		const labelSize = Math.max(14, 22 * Math.min(sx, sy));
		ctx.fillStyle = "rgba(190,242,100,0.95)";
		ctx.font = `bold ${labelSize}px "Outfit", sans-serif`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText("KITCHEN", COURT_MID_X * sx, (KITCHEN_BOUNDS.top + 28) * sy);
		ctx.fillStyle = "rgba(255,255,255,0.78)";
		ctx.font = `${Math.max(11, 13 * Math.min(sx, sy))}px "Noto Sans TC", sans-serif`;
		ctx.fillText(
			"禁打高球區．須等彈跳",
			COURT_MID_X * sx,
			(KITCHEN_BOUNDS.top + 56) * sy,
		);

		// 球
		const ball = ballRef.current;
		if (ball) {
			const pos = {
				x: ball.body.position.x,
				y: ball.body.position.y,
				height: Math.max(0, ball.z),
			};
			const shadowAlpha = 0.55 - Math.min(0.45, pos.height / 600);
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

	// === 主迴圈：matter-js 引擎更新 + 自訂 Z 重力 + 多重彈跳 ===
	const loopEnabled =
		!paused && state.status !== "idle" && state.status !== "game_over";

	useGameLoop(
		(dt) => {
			elapsedSinceAwaitRef.current += dt;
			elapsedSinceServeRef.current += dt;

			const engine = engineRef.current;
			const ball = ballRef.current;
			if (engine && ball) {
				// matter-js 處理 X/Y 平面運動
				Matter.Engine.update(engine, dt);

				// 自訂 Z（高度）：真實牛頓重力
				const dtSec = dt / 1000;
				ball.vz -= G_VERTICAL * dtSec;
				ball.z += ball.vz * dtSec;

				if (ball.z <= 0 && ball.vz < 0) {
					// 落地：垂直回彈、水平阻尼
					ball.z = 0;
					ball.vz = -ball.vz * RESTITUTION;
					ball.bounceCount++;
					if (!ball.hasBounced) {
						ball.hasBounced = true;
					}
					Matter.Body.setVelocity(ball.body, {
						x: ball.body.velocity.x * HORIZONTAL_DAMPING,
						y: ball.body.velocity.y * HORIZONTAL_DAMPING,
					});
					if (ball.bounceCount >= MAX_BOUNCES) {
						ball.vz = 0;
						Matter.Body.setVelocity(ball.body, { x: 0, y: 0 });
					}
				}
			}

			drawScene();

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
			landingPoint: { x: ball.endX, y: ball.endY },
			ballState: ball.hasBounced ? "after_bounce" : "in_air",
			paddlePoint: point,
			toleranceRadius: DEFAULT_DIFFICULTY.toleranceRadius,
		});
		dispatch({ type: "PLAYER_HIT", result });
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

// === Helpers ===
function drawDiagonalStripes(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	color: string,
	spacing: number,
): void {
	ctx.save();
	ctx.beginPath();
	ctx.rect(x, y, w, h);
	ctx.clip();
	ctx.strokeStyle = color;
	ctx.lineWidth = Math.max(1, spacing * 0.25);
	const diag = w + h;
	for (let i = -diag; i < diag; i += spacing) {
		ctx.beginPath();
		ctx.moveTo(x + i, y);
		ctx.lineTo(x + i + h, y + h);
		ctx.stroke();
	}
	ctx.restore();
}
