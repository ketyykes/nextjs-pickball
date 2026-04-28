import type { Difficulty } from "@/lib/play/types";

export const DEFAULT_DIFFICULTY: Difficulty = {
	ballSpeed: 0.4,
	toleranceRadius: 60,
	kitchenLandingProbability: 0.5,
	hitTimeoutMs: 3000,
	bouncePeakHeight: 90,
	bounceDurationMs: 800,
};
