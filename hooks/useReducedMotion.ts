import { useEffect, useState } from "react";

// 監聽 prefers-reduced-motion: reduce，回傳目前狀態。
// 初值以 useState getter 直接讀取 matchMedia，避免 SSR 後第一次渲染閃爍。
export function useReducedMotion(): boolean {
	const [reduced, setReduced] = useState<boolean>(() => {
		if (typeof window === "undefined") return false;
		return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	});

	useEffect(() => {
		const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
		const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);

		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, []);

	return reduced;
}
