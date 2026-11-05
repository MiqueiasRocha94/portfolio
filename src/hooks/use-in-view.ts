"use client";

import { useEffect, useRef, useState } from "react";

type UseInViewOptions = Pick<IntersectionObserverInit, "threshold" | "rootMargin"> & {
  /** `true`: depois de entrar, fica visível (para de observar). */
  once?: boolean;
};

/** Elemento visível na tela (dispara as animações de entrada do portfólio). */
export function useInView<T extends HTMLElement = HTMLElement>({ once = true, threshold, rootMargin }: UseInViewOptions = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once, threshold, rootMargin]);

  return { ref, inView };
}
