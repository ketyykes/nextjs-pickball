import { useCallback, useEffect, useRef, useState } from "react";

interface FadeInOnViewResult<T extends Element> {
	ref: (node: T | null) => void;
	isVisible: boolean;
}

interface FadeInOnViewOptions {
	threshold?: number;
	rootMargin?: string;
	once?: boolean;
}

// 觀察元素是否進入視窗。預設 once=true：第一次出現即固定為 visible，不再回退。
export function useFadeInOnView<T extends Element>(
	options: FadeInOnViewOptions = {},
): FadeInOnViewResult<T> {
	const { threshold = 0.1, rootMargin = "0px 0px -40px 0px", once = true } =
		options;
	const [isVisible, setIsVisible] = useState(false);
	const elementRef = useRef<T | null>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);

	const ref = useCallback(
		(node: T | null) => {
			observerRef.current?.disconnect();
			elementRef.current = node;
			if (!node) return;

			const observer = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (entry.isIntersecting) {
							setIsVisible(true);
							if (once) observer.disconnect();
						} else if (!once) {
							setIsVisible(false);
						}
					}
				},
				{ threshold, rootMargin },
			);

			observer.observe(node);
			observerRef.current = observer;
		},
		[threshold, rootMargin, once],
	);

	useEffect(() => {
		return () => observerRef.current?.disconnect();
	}, []);

	return { ref, isVisible };
}
