import { describe, it, expect, beforeEach } from "vitest";
import { readScoreboard, writeScoreboard, clearScoreboard, STORAGE_KEY } from "./storage";
import { createInitialState } from "./reducer";

describe("storage", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("write 後 read 可取回相同 state", () => {
		const state = createInitialState();
		writeScoreboard(state);
		expect(readScoreboard()).toEqual(state);
	});

	it("無資料時 read 回 null", () => {
		expect(readScoreboard()).toBeNull();
	});

	it("資料為非 JSON 時 read 回 null 並清 key", () => {
		localStorage.setItem(STORAGE_KEY, "not-json");
		expect(readScoreboard()).toBeNull();
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
	});

	it("資料 schema 不合法時 read 回 null 並清 key", () => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: "invalid" }));
		expect(readScoreboard()).toBeNull();
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
	});

	it("clearScoreboard 移除 key", () => {
		writeScoreboard(createInitialState());
		clearScoreboard();
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
	});
});
