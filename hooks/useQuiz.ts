"use client";

import { useState } from "react";
import { QUESTION_BANK } from "@/data/quiz/questions";
import type { ShuffledQuestion, MultipleChoiceQuestion } from "@/data/quiz/questions";

const QUIZ_SIZE = 10;

function shuffleArray<T>(arr: T[]): T[] {
	const result = [...arr];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

/**
 * 從題庫抽 QUIZ_SIZE 題並洗牌：
 * - multiple-choice：選項 Fisher-Yates 洗牌，shuffledCorrectIndex 同步更新。
 * - true-false：選項固定為 ["正確", "錯誤"]，shuffledCorrectIndex = correct ? 0 : 1。
 */
function buildShuffledQuestions(): ShuffledQuestion[] {
	const picked = shuffleArray([...QUESTION_BANK]).slice(0, QUIZ_SIZE);
	return picked.map((q) => {
		if (q.type === "true-false") {
			return { ...q, shuffledCorrectIndex: q.correct ? 0 : 1 };
		}
		const mc = q as MultipleChoiceQuestion;
		const indices = shuffleArray([...mc.options.keys()]);
		const shuffledOptions = indices.map((i) => mc.options[i]);
		const shuffledCorrectIndex = indices.indexOf(mc.correctIndex);
		const { correctIndex: _unused, ...rest } = mc;
		void _unused;
		return { ...rest, options: shuffledOptions, shuffledCorrectIndex };
	});
}

type QuizPhase = "answering" | "revealed" | "finished";

interface QuizState {
	questions: ShuffledQuestion[];
	currentIndex: number;
	phase: QuizPhase;
	selectedOption: number | null;
	answers: boolean[];
}

function createInitialState(): QuizState {
	return {
		questions: buildShuffledQuestions(),
		currentIndex: 0,
		phase: "answering",
		selectedOption: null,
		answers: [],
	};
}

export interface UseQuizReturn {
	questions: ShuffledQuestion[];
	currentIndex: number;
	phase: QuizPhase;
	selectedOption: number | null;
	answers: boolean[];
	selectOption: (index: number) => void;
	nextQuestion: () => void;
	restart: () => void;
}

export function useQuiz(): UseQuizReturn {
	const [state, setState] = useState<QuizState>(createInitialState);

	function selectOption(index: number) {
		if (state.phase !== "answering") return;
		const isCorrect = index === state.questions[state.currentIndex].shuffledCorrectIndex;
		setState((s) => ({
			...s,
			phase: "revealed",
			selectedOption: index,
			answers: [...s.answers, isCorrect],
		}));
	}

	function nextQuestion() {
		if (state.phase !== "revealed") return;
		const isLast = state.currentIndex === state.questions.length - 1;
		setState((s) => ({
			...s,
			currentIndex: isLast ? s.currentIndex : s.currentIndex + 1,
			phase: isLast ? "finished" : "answering",
			selectedOption: null,
		}));
	}

	function restart() {
		setState(createInitialState());
	}

	return {
		questions: state.questions,
		currentIndex: state.currentIndex,
		phase: state.phase,
		selectedOption: state.selectedOption,
		answers: state.answers,
		selectOption,
		nextQuestion,
		restart,
	};
}
