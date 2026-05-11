"use client";

import { type Dispatch, useEffect, useReducer } from "react";
import { createInitialState, scoreboardReducer } from "@/lib/scoreboard/reducer";
import { readScoreboard, writeScoreboard } from "@/lib/scoreboard/storage";
import type { Action, ScoreboardState } from "@/lib/scoreboard/types";

/**
 * 記分板狀態管理 hook，整合 useReducer 與 localStorage。
 *
 * - SSR 安全：初始 state 由 createInitialState 產生，避免 server/client 不一致
 * - Hydration：mount 後讀取 localStorage，有資料則 dispatch HYDRATE 同步
 * - 持久化：state 每次變動都寫回 localStorage
 */
export function useScoreboardStore(): readonly [
	ScoreboardState,
	Dispatch<Action>,
] {
	const [state, dispatch] = useReducer(
		scoreboardReducer,
		undefined,
		// init 函式：useReducer 傳入 undefined 作為 arg，包一層轉為空物件
		(_arg: undefined) => createInitialState(),
	);

	// mount 後嘗試從 localStorage hydrate（SSR 不執行）
	useEffect(() => {
		const loaded = readScoreboard();
		if (loaded) dispatch({ type: "HYDRATE", state: loaded });
	}, []);

	// state 變動時寫回 localStorage
	useEffect(() => {
		writeScoreboard(state);
	}, [state]);

	return [state, dispatch] as const;
}
