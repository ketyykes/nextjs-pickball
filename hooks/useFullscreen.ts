"use client";

import { useCallback, useEffect, useState } from "react";

interface UseFullscreenResult {
	isSupported: boolean;
	isFullscreen: boolean;
	toggle: () => Promise<void>;
}

// 封裝 Fullscreen API；iOS Safari 與舊瀏覽器不支援時 isSupported=false。
export function useFullscreen(): UseFullscreenResult {
	const isSupported =
		typeof document !== "undefined" && !!document.fullscreenEnabled;
	const [isFullscreen, setIsFullscreen] = useState(false);

	useEffect(() => {
		const onChange = () => setIsFullscreen(!!document.fullscreenElement);
		document.addEventListener("fullscreenchange", onChange);
		onChange();
		return () => document.removeEventListener("fullscreenchange", onChange);
	}, []);

	const toggle = useCallback(async () => {
		if (!isSupported) return;
		if (document.fullscreenElement) {
			await document.exitFullscreen();
		} else {
			await document.documentElement.requestFullscreen();
		}
	}, [isSupported]);

	return { isSupported, isFullscreen, toggle };
}
