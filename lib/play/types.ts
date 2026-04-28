export interface Point {
	x: number;
	y: number;
}

export type GameStatus =
	| "idle"
	| "serving"
	| "incoming"
	| "awaiting_input"
	| "judging"
	| "next_ball"
	| "game_over";

export type BallState = "in_air" | "after_bounce";

export type JudgeResult =
	| { kind: "legal" }
	| { kind: "violation_kitchen" }
	| { kind: "miss" };

export interface GameState {
	status: GameStatus;
	score: number;
	lives: number;
	combo: number;
	lastResult: "legal" | "violation_kitchen" | "miss" | null;
}

export type GameAction =
	| { type: "START" }
	| { type: "BALL_LANDED" }
	| { type: "PLAYER_HIT"; result: JudgeResult }
	| { type: "TIMEOUT" }
	| { type: "RESTART" }
	| { type: "PAUSE" }
	| { type: "RESUME" };

export interface Difficulty {
	ballSpeed: number;
	toleranceRadius: number;
	kitchenLandingProbability: number;
	hitTimeoutMs: number;
}
