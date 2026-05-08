// 偵測瀏覽器是否支援 CSS scroll-timeline 與 animation-range；同時支援才回 true。
// 非瀏覽器環境（CSS 不存在）回傳 false 而非拋錯。
export function supportsScrollTimeline(): boolean {
	if (typeof CSS === "undefined" || typeof CSS.supports !== "function") {
		return false;
	}

	return (
		CSS.supports("animation-timeline: scroll()") &&
		CSS.supports("animation-range: entry 0% exit 100%")
	);
}
