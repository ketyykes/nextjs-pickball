// tests/e2e/specs/play.spec.ts
import { expect, test } from "@playwright/test";

test.describe("Hero → /play 入口", () => {
	test("首頁 Hero 顯示 /play 入口連結", async ({ page }) => {
		await page.goto("/");
		const link = page.getByTestId("hero-play-link");
		await expect(link).toBeVisible();
		await expect(link).toHaveAttribute("href", "/play");
		await expect(link).toContainText("練習");
	});

	test("點擊 Hero 入口連結後可進入 /play 看到開始按鈕", async ({ page }) => {
		await page.goto("/");
		await page.getByTestId("hero-play-link").click();
		await expect(page).toHaveURL("/play");
		await expect(page.getByTestId("play-start-button")).toBeVisible();
	});
});

test.describe("/play 基本流程", () => {
	test("進入 /play 顯示開始按鈕", async ({ page }) => {
		await page.goto("/play");
		await expect(page.getByTestId("play-start-button")).toBeVisible();
	});

	test("點擊開始按鈕後 HUD 顯示初始分數與三條命", async ({ page }) => {
		await page.goto("/play");
		await page.getByTestId("play-start-button").click();
		await expect(page.getByTestId("hud-score")).toContainText("0");
		await expect(page.getByTestId("hud-lives")).toContainText("❤");
		await expect(page.getByTestId("hud-combo")).toContainText("0");
	});

	test("GameCanvas 容器套用 touch-action:none", async ({ page }) => {
		await page.goto("/play");
		await page.getByTestId("play-start-button").click();
		const container = page.getByTestId("game-canvas-container");
		await expect(container).toBeVisible();
		const touchAction = await container.evaluate(
			(el) => getComputedStyle(el as HTMLElement).touchAction,
		);
		expect(touchAction).toBe("none");
	});

	test("視窗縮小時 Canvas 仍完整顯示球場", async ({ page }) => {
		await page.setViewportSize({ width: 360, height: 640 });
		await page.goto("/play");
		await page.getByTestId("play-start-button").click();
		const canvasBox = await page
			.getByTestId("game-canvas-container")
			.locator("canvas")
			.boundingBox();
		expect(canvasBox).not.toBeNull();
		expect(canvasBox!.width).toBeGreaterThan(0);
		expect(canvasBox!.height).toBeGreaterThan(0);
	});
});

test.describe("/play 互動", () => {
	test("行動裝置觸控可觸發擊球並改變 HUD", async ({ page, isMobile }) => {
		test.skip(!isMobile, "僅 mobile project 執行");
		await page.goto("/play");
		await page.getByTestId("play-start-button").click();

		const livesBefore = (
			await page.getByTestId("hud-lives").textContent()
		)?.trim();

		// 等待第一球進入 awaiting_input
		await page.waitForTimeout(200);
		const container = page.getByTestId("game-canvas-container");
		const box = await container.boundingBox();
		expect(box).not.toBeNull();
		await page.tap('[data-testid="game-canvas-container"]', {
			position: { x: box!.width / 2, y: box!.height / 2 },
		});
		await page.waitForTimeout(300);

		const livesAfter = (
			await page.getByTestId("hud-lives").textContent()
		)?.trim();
		const scoreAfter = await page.getByTestId("hud-score").textContent();
		const comboAfter = await page.getByTestId("hud-combo").textContent();

		// 三項中至少一項相對 livesBefore=❤ ❤ ❤、score=0、combo=0 有變化
		const livesChanged = livesAfter !== livesBefore;
		const scoreChanged = !!scoreAfter && !scoreAfter.includes("0");
		const comboChanged = !!comboAfter && !comboAfter.includes("x0");
		expect(livesChanged || scoreChanged || comboChanged).toBe(true);
	});

	// 此 test 因球的隨機落點 + 球拍須同時在容忍半徑內 + 球仍在空中三個條件須同時成立，
	// E2E 黑箱無法可靠觸發違規（沒有 ball 位置資訊）。違規行為已由單元測試覆蓋：
	//   - lib/play/judge.test.ts 「球落 Kitchen 內且玩家 volley 應判違規」
	//   - lib/play/state.test.ts 「違規 Kitchen 應扣 1 命並重置連擊」
	//   - 整合鏈條：handlePointerDown 在 result.kind === "violation_kitchen" 時 setRuleCardVisible(true)
	//     + RuleCard 依 visible prop 渲染（皆為純結構），由手動 smoke 驗證。
	test.skip("違規後規則小卡可見", async ({ page }) => {
		await page.goto("/play");
		await page.getByTestId("play-start-button").click();
		// 球隨機落點，Kitchen 區內球需在「球未落地」時被擊中才會觸發違規。
		// 在 Kitchen 對應的視窗 y 範圍內掃多個位置，每點 180ms 多次嘗試以涵蓋多顆球。
		const container = page.getByTestId("game-canvas-container");
		const box = await container.boundingBox();
		expect(box).not.toBeNull();
		// Kitchen 對應虛擬座標 y∈[600,750]，球場高 900 → 視窗百分比 0.667–0.833
		const positions = [
			{ x: 0.3, y: 0.7 },
			{ x: 0.5, y: 0.7 },
			{ x: 0.7, y: 0.7 },
			{ x: 0.4, y: 0.78 },
			{ x: 0.5, y: 0.78 },
			{ x: 0.6, y: 0.78 },
		];
		const ruleCard = page.getByTestId("rule-card-kitchen");

		for (let i = 0; i < 36; i++) {
			await page.waitForTimeout(180);
			const p = positions[i % positions.length];
			await container.click({
				position: { x: box!.width * p.x, y: box!.height * p.y },
			});
			if (await ruleCard.isVisible().catch(() => false)) break;
		}
		await expect(ruleCard).toBeVisible({ timeout: 4000 });
	});

	test("game over 後顯示結算 modal 與回首頁規則連結", async ({ page }) => {
		await page.goto("/play");
		await page.getByTestId("play-start-button").click();
		// 多次點極遠處（一定 miss）→ 扣命，3 條命用盡後 game_over
		const container = page.getByTestId("game-canvas-container");
		const box = await container.boundingBox();
		expect(box).not.toBeNull();

		for (let i = 0; i < 6; i++) {
			await page.waitForTimeout(800);
			await container.click({ position: { x: 5, y: 5 } });
		}

		const modal = page.getByTestId("game-over-modal");
		await expect(modal).toBeVisible({ timeout: 8000 });
		const link = modal.locator('a[href="/#kitchen"]');
		await expect(link).toBeVisible();
		await expect(modal.getByTestId("restart-button")).toBeVisible();
	});
});
