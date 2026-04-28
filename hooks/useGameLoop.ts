"use client";

import { useEffect, useRef } from "react";

export interface UseGameLoopOptions {
	now?: () => number;
	raf?: (cb: FrameRequestCallback) => number;
	cancel?: (id: number) => void;
	enabled?: boolean;
}

// RAF 迴圈，以 deltaMs 驅動 callback；可注入時間源以利測試。
export function useGameLoop(
	callback: (deltaMs: number) => void,
	options: UseGameLoopOptions = {},
): void {
	const {
		now = () => performance.now(),
		raf = (cb: FrameRequestCallback) => requestAnimationFrame(cb),
		cancel = (id: number) => cancelAnimationFrame(id),
		enabled = true,
	} = options;

	const callbackRef = useRef(callback);
	callbackRef.current = callback;

	useEffect(() => {
		if (!enabled) return;
		let lastTime = now();
		let rafId = 0;

		const tick: FrameRequestCallback = () => {
			const current = now();
			const deltaMs = current - lastTime;
			lastTime = current;
			callbackRef.current(deltaMs);
			rafId = raf(tick);
		};

		rafId = raf(tick);

		return () => {
			cancel(rafId);
		};
	}, [enabled, now, raf, cancel]);
}
