import { test, expect } from "@playwright/test";

// /tour 體驗 + Hero CTA 的端對端驗收
// - 對應 spec: tour-experience › 對應 E2E 驗收
// - 6 條 case 涵蓋：CTA 導向、Stage 1 標題、6 個 stage 容器排序、ClosingStage 返回鈕、Skip 跳過、reduced-motion 可讀性
test.describe("/tour 體驗", () => {
	test("首頁有 CTA 並能導向 /tour", async ({ page }) => {
		await page.goto("/");
		const cta = page.getByRole("button", { name: /進入完整體驗/ });
		// CTA 在 Hero 內部、由 scroll progress 控制 opacity；要先讓使用者看到
		// （捲到 Hero scroll 進度 90% 之後才浮現）。先捲到 Hero 底端再 click。
		await page.evaluate(() => window.scrollTo({ top: window.innerHeight, behavior: "instant" }));
		await expect(cta).toBeVisible();
		await cta.click();
		await expect(page).toHaveURL(/\/tour$/);
	});

	test("/tour 載入後可見 Stage 1 標題", async ({ page }) => {
		await page.goto("/tour");
		await expect(page.getByText("比網球更小，")).toBeVisible();
	});

	test("DOM 中存在 6 個 data-stage-id 容器並依序排列", async ({ page }) => {
		await page.goto("/tour");
		const stages = page.locator("[data-stage-id]");
		await expect(stages).toHaveCount(6);
		const ids = await stages.evaluateAll((els) =>
			els.map((el) => el.getAttribute("data-stage-id")),
		);
		expect(ids).toEqual([
			"court-size",
			"player-growth",
			"two-bounce",
			"kitchen-violation",
			"materials-spectrum",
			"closing",
		]);
	});

	test("捲動到底可見 ClosingStage 與返回按鈕", async ({ page }) => {
		await page.goto("/tour");
		const main = page.locator("main");
		// scroll-snap 容器手動下捲到底
		await main.evaluate((el) => {
			el.scrollTo({ top: el.scrollHeight, behavior: "instant" as ScrollBehavior });
		});
		await expect(page.getByRole("button", { name: "回到完整指南" })).toBeVisible();
	});

	test("Skip 按鈕導向 /#court", async ({ page }) => {
		await page.goto("/tour");
		await page.getByRole("button", { name: /跳過/ }).click();
		await expect(page).toHaveURL(/\/#court$/);
		// 等待錨點滾動完成
		await page.waitForTimeout(400);
		const courtSection = page.locator("#court");
		await expect(courtSection).toBeInViewport();
	});

	test("reduced motion 下 6 個 stage 內容仍可讀", async ({ browser }) => {
		const context = await browser.newContext({ reducedMotion: "reduce" });
		const page = await context.newPage();
		await page.goto("/tour");
		await expect(page.getByText("比網球更小，")).toBeVisible();
		const main = page.locator("main");
		await main.evaluate((el) => {
			el.scrollTo({ top: el.scrollHeight, behavior: "instant" as ScrollBehavior });
		});
		await expect(page.getByRole("button", { name: "回到完整指南" })).toBeVisible();
		await context.close();
	});
});
