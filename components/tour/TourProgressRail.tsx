"use client";

import { useEffect, useState } from "react";

const STAGE_IDS = [
	"court-size",
	"player-growth",
	"two-bounce",
	"kitchen-violation",
	"materials-spectrum",
	"closing",
] as const;

// 左側 fixed 直條，6 格依當前 stage 高亮。以 IntersectionObserver 偵測哪一個 stage
// 占視窗中央較多。
export function TourProgressRail() {
	const [activeIndex, setActiveIndex] = useState(0);

	useEffect(() => {
		const observers: IntersectionObserver[] = [];
		STAGE_IDS.forEach((id, idx) => {
			const el = document.querySelector<HTMLElement>(`[data-stage-id="${id}"]`);
			if (!el) return;

			const observer = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
							setActiveIndex(idx);
						}
					}
				},
				{ threshold: [0.5] },
			);
			observer.observe(el);
			observers.push(observer);
		});

		return () => {
			observers.forEach((o) => o.disconnect());
		};
	}, []);

	return (
		<div
			role="progressbar"
			aria-valuemin={1}
			aria-valuemax={STAGE_IDS.length}
			aria-valuenow={activeIndex + 1}
			aria-label="導覽進度"
			className="fixed top-1/2 left-6 z-50 flex -translate-y-1/2 flex-col gap-2"
		>
			{STAGE_IDS.map((id, idx) => (
				<span
					key={id}
					data-active={idx === activeIndex}
					className="block h-8 w-1 rounded-full bg-white/20 transition-colors data-[active=true]:bg-lime-400"
				/>
			))}
		</div>
	);
}
