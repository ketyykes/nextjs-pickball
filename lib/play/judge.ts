import { isInKitchen } from "./court";
import type { BallState, JudgeResult, Point } from "./types";

export interface JudgeHitInput {
	landingPoint: Point;
	ballState: BallState;
	paddlePoint: Point;
	toleranceRadius: number;
}

export function judgeHit(input: JudgeHitInput): JudgeResult {
	const { landingPoint, ballState, paddlePoint, toleranceRadius } = input;
	const dx = paddlePoint.x - landingPoint.x;
	const dy = paddlePoint.y - landingPoint.y;
	const distance = Math.sqrt(dx * dx + dy * dy);
	if (distance > toleranceRadius) {
		return { kind: "miss" };
	}
	if (isInKitchen(landingPoint) && ballState === "in_air") {
		return { kind: "violation_kitchen" };
	}
	return { kind: "legal" };
}
