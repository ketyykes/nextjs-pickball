import type { Metadata } from "next";
import dynamic from "next/dynamic";

// 使用 dynamic import + ssr:false 解決 Math.random() 造成的 hydration mismatch
// QuizShell 含隨機抽題邏輯，無 SEO 需求，完全跳過 SSR 即可
const QuizShell = dynamic(
	() => import("@/components/quiz/QuizShell").then((m) => m.QuizShell),
	{
		ssr: false,
		loading: () => (
			<div className="animate-pulse h-64 rounded-lg bg-muted" />
		),
	},
);

export const metadata: Metadata = {
	title: "規則隨堂測驗 | 匹克球指南",
	description: "從 25 道題庫中隨機抽 10 題，測驗你對匹克球規則的掌握程度",
};

export default function QuizPage() {
	return (
		<div className="min-h-screen bg-background pt-14">
			<div className="mx-auto max-w-[640px] px-6 py-12">
				<div className="mb-8">
					<h1 className="font-outfit text-3xl font-bold tracking-tight">
						規則隨堂測驗
					</h1>
					<p className="mt-2 text-muted-foreground">
						隨機抽取 10 題，測驗你對匹克球規則的掌握程度
					</p>
				</div>
				<QuizShell />
			</div>
		</div>
	);
}
