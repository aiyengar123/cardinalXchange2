"use client";

import { useEffect } from "react";

const STORAGE_KEY = "cxc:viewed-questions";
const MAX_HISTORY = 10;

export type ViewedQuestion = {
  slug: string;
  title: string;
  viewedAt: number;
};

export function recordView(slug: string, title: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: ViewedQuestion[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((q) => q.slug !== slug);
    const updated = [{ slug, title, viewedAt: Date.now() }, ...filtered].slice(
      0,
      MAX_HISTORY,
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable — silently skip
  }
}

export function getViewHistory(): ViewedQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function RecordView({ slug, title }: { slug: string; title: string }) {
  useEffect(() => {
    recordView(slug, title);
  }, [slug, title]);

  return null;
}

export default RecordView;
