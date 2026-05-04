"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STICK_THRESHOLD_PX = 64;

export function useStickToBottom<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      setIsAtBottom(distance < STICK_THRESHOLD_PX);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return { ref, isAtBottom, scrollToBottom };
}
