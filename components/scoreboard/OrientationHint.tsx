// components/scoreboard/OrientationHint.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const DISMISS_KEY = "scoreboard:hint-dismissed";

interface OrientationHintProps {
	visible: boolean; // 由父層依 orientation 決定
}

// 直式時顯示的提示橫幅；關閉狀態存 sessionStorage，分頁存活期間不再顯示
export function OrientationHint({ visible }: OrientationHintProps) {
	// 以惰性初始函式讀取 sessionStorage，避免 effect 內 setState 觸發 cascading render
	const [dismissed, setDismissed] = useState(
		() => typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY) === "1",
	);

	if (!visible || dismissed) return null;

	return (
		<div
			role="status"
			className="flex items-center justify-between gap-2 border-b border-lime-500/20 bg-lime-500/10 px-4 py-2 text-sm"
		>
			<span>💡 建議橫向使用，體驗更好</span>
			<Button
				variant="ghost"
				size="icon"
				aria-label="關閉提示"
				onClick={() => {
					sessionStorage.setItem(DISMISS_KEY, "1");
					setDismissed(true);
				}}
			>
				<X className="size-4" />
			</Button>
		</div>
	);
}
