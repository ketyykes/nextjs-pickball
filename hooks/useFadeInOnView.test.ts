import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { setupIntersectionObserverMock } from "@/tests/helpers/intersectionObserver";
import { useFadeInOnView } from "./useFadeInOnView";

describe("useFadeInOnView", () => {
	let mock: ReturnType<typeof setupIntersectionObserverMock>;

	beforeEach(() => {
		mock = setupIntersectionObserverMock();
	});

	afterEach(() => {
		mock.cleanup();
	});

	it("應在元素進入視窗時將 isVisible 設為 true", () => {
		const { result } = renderHook(() => useFadeInOnView<HTMLDivElement>());

		const element = document.createElement("div");
		act(() => {
			result.current.ref(element);
		});

		expect(result.current.isVisible).toBe(false);

		act(() => {
			mock.triggerIntersect(element, true);
		});

		expect(result.current.isVisible).toBe(true);
	});
});
