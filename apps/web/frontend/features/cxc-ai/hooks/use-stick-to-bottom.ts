"use client";

import { useCallback, useEffect, useState } from "react";

const STICK_THRESHOLD_PX = 96;

/**
 * Tracks whether the document is scrolled near the bottom of the viewport.
 * Used to gate auto-scroll-on-new-message so we never yank a user who has
 * scrolled up to read history.
 */
export function useStickToBottom() {
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (typeof window === "undefined") return;
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior,
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => {
      const distance =
        document.documentElement.scrollHeight -
        window.scrollY -
        window.innerHeight;
      setIsAtBottom(distance < STICK_THRESHOLD_PX);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { isAtBottom, scrollToBottom };
}
