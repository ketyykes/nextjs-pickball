"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// 右下角 fixed 「跳過 →」按鈕，導向 /#court。view transition 串接於 task 10。
export function TourSkipButton() {
	const router = useRouter();

	return (
		<Button
			type="button"
			onClick={() => router.push("/#court")}
			className="fixed right-6 bottom-6 z-50 bg-white/10 text-white backdrop-blur hover:bg-white/20"
		>
			跳過 →
		</Button>
	);
}
