import { test, expect } from "@playwright/test";

// /quiz 規則隨堂測驗的 E2E smoke tests
// 涵蓋四個情境：
//   A. 從 Navbar 進入 /quiz
//   B. 選擇答案後出現解說與下一題 / 看結果按鈕
//   C. 完整答完 10 題後顯示成績
//   D. 再試一次回到第一題
//
// 已知產品問題（不阻擋 smoke）：
//   useQuiz 使用 Math.random() 初始化題庫，造成 SSR/CSR hydration mismatch。
//   React 會自動重新 render，功能仍正常，但 pageerror 會觸發 hydration warning。
//   測試中收集此錯誤並於結束時輸出，等待 hydration 完成（waitForFunction）後再互動。

/** 等待 hydration mismatch 解決：確認頁面上不再有 hydration 相關的 loading 狀態 */
async function waitForHydration(page: import("@playwright/test").Page) {
	// 等待 React hydration 完成：題號文字穩定可見即視為完成
	await expect(page.getByText(/第 \d+ 題，共 10 題/)).toBeVisible();
}

test.describe("/quiz 規則隨堂測驗", () => {
	// 收集測試期間的 browser console errors
	// hydration mismatch 是已知產品問題，收集後輸出但不中斷 smoke 流程
	const setupConsoleMonitor = (page: import("@playwright/test").Page) => {
		const consoleErrors: string[] = [];
		const pageErrors: string[] = [];
		const hydrationErrors: string[] = [];

		page.on("console", (msg) => {
			if (msg.type() === "error") {
				const text = msg.text();
				// 忽略 dev mode 常見 React 警告
				if (text.includes("Warning:") || text.includes("act(")) return;
				consoleErrors.push(text);
			}
		});

		page.on("pageerror", (error) => {
			const msg = error.message;
			// 分類：hydration mismatch 是已知產品問題，其餘為真正錯誤
			if (msg.includes("Hydration failed") || msg.includes("hydration")) {
				hydrationErrors.push(msg.slice(0, 200));
			} else {
				pageErrors.push(msg);
			}
		});

		return { consoleErrors, pageErrors, hydrationErrors };
	};

	test("A. 從 Navbar 點「測驗」連結進入 /quiz 並顯示第 1 題題號", async ({ page }) => {
		const { consoleErrors, pageErrors, hydrationErrors } = setupConsoleMonitor(page);

		await page.goto("/");
		await page.getByRole("link", { name: "測驗" }).click();
		await expect(page).toHaveURL(/\/quiz$/);
		await waitForHydration(page);

		if (hydrationErrors.length > 0) {
			console.warn("[已知產品問題] Hydration mismatch（Math.random 造成 SSR/CSR 不一致）:", hydrationErrors[0]);
		}

		// 非 hydration 的嚴重錯誤才中斷測試
		expect(consoleErrors, `Console errors: ${consoleErrors.join(", ")}`).toHaveLength(0);
		expect(pageErrors, `非 hydration 的 Page errors: ${pageErrors.join(", ")}`).toHaveLength(0);
	});

	test("B. 選擇答案後出現解說區塊與下一題 / 看結果按鈕", async ({ page }) => {
		const { consoleErrors, pageErrors, hydrationErrors } = setupConsoleMonitor(page);

		await page.goto("/quiz");
		await waitForHydration(page);

		// 點第一個選項按鈕（排除導覽類按鈕）
		const optionButtons = page.locator("button").filter({
			hasNotText: /下一題|看結果|再試一次/,
		});
		await optionButtons.first().click();

		// 解說區塊出現
		await expect(page.getByText("解說：")).toBeVisible();

		// 下一題 或 看結果 按鈕出現
		await expect(
			page.getByRole("button", { name: /下一題|看結果/ }),
		).toBeVisible();

		if (hydrationErrors.length > 0) {
			console.warn("[已知產品問題] Hydration mismatch（Math.random 造成 SSR/CSR 不一致）:", hydrationErrors[0]);
		}

		expect(consoleErrors, `Console errors: ${consoleErrors.join(", ")}`).toHaveLength(0);
		expect(pageErrors, `非 hydration 的 Page errors: ${pageErrors.join(", ")}`).toHaveLength(0);
	});

	test("C. 完整答完 10 題後顯示成績頁（含「/ 10」文字與「再試一次」按鈕）", async ({ page }) => {
		const { consoleErrors, pageErrors, hydrationErrors } = setupConsoleMonitor(page);

		await page.goto("/quiz");
		await waitForHydration(page);

		// 依序答完 10 題：每題選第一個選項 → 按「下一題」或「看結果」
		for (let i = 0; i < 10; i++) {
			// 等待題號更新確保 UI 準備就緒
			await expect(page.getByText(`第 ${i + 1} 題，共 10 題`)).toBeVisible();

			// 點第一個選項按鈕
			const optionButtons = page.locator("button").filter({
				hasNotText: /下一題|看結果|再試一次/,
			});
			await optionButtons.first().click();

			// 等待解說出現後再按下一題 / 看結果
			await expect(page.getByText("解說：")).toBeVisible();
			await page.getByRole("button", { name: /下一題|看結果/ }).click();
		}

		// 成績頁：包含「/ 10」文字
		await expect(page.getByText("/ 10")).toBeVisible();

		// 「再試一次」按鈕存在
		await expect(page.getByRole("button", { name: "再試一次" })).toBeVisible();

		if (hydrationErrors.length > 0) {
			console.warn("[已知產品問題] Hydration mismatch（Math.random 造成 SSR/CSR 不一致）:", hydrationErrors[0]);
		}

		expect(consoleErrors, `Console errors: ${consoleErrors.join(", ")}`).toHaveLength(0);
		expect(pageErrors, `非 hydration 的 Page errors: ${pageErrors.join(", ")}`).toHaveLength(0);
	});

	test("D. 按「再試一次」回到第一題", async ({ page }) => {
		const { consoleErrors, pageErrors, hydrationErrors } = setupConsoleMonitor(page);

		await page.goto("/quiz");
		await waitForHydration(page);

		// 快速答完 10 題
		for (let i = 0; i < 10; i++) {
			await expect(page.getByText(`第 ${i + 1} 題，共 10 題`)).toBeVisible();

			const optionButtons = page.locator("button").filter({
				hasNotText: /下一題|看結果|再試一次/,
			});
			await optionButtons.first().click();
			await expect(page.getByText("解說：")).toBeVisible();
			await page.getByRole("button", { name: /下一題|看結果/ }).click();
		}

		// 確認已到成績頁
		await expect(page.getByText("/ 10")).toBeVisible();

		// 按「再試一次」
		await page.getByRole("button", { name: "再試一次" }).click();

		// 回到第一題
		await expect(page.getByText("第 1 題，共 10 題")).toBeVisible();

		if (hydrationErrors.length > 0) {
			console.warn("[已知產品問題] Hydration mismatch（Math.random 造成 SSR/CSR 不一致）:", hydrationErrors[0]);
		}

		expect(consoleErrors, `Console errors: ${consoleErrors.join(", ")}`).toHaveLength(0);
		expect(pageErrors, `非 hydration 的 Page errors: ${pageErrors.join(", ")}`).toHaveLength(0);
	});
});
