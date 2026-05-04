"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@cardinalxchange/ui";

import type { AiChatSession } from "@/server/http/contracts";

type ChatHistoryRailProps = {
  sessions: AiChatSession[];
};

/**
 * Second left rail used only on `/cxc-ai/*`. Lists past CXC AI sessions
 * with a `New chat` link at the top. Active item (matching the current
 * `[chatId]`) gets the same left-bar treatment as `TopicRail`.
 */
export function ChatHistoryRail({ sessions }: ChatHistoryRailProps) {
  const pathname = usePathname() ?? "";
  const activeChatId = extractActiveChatId(pathname);
  const sorted = [...sessions].sort(
    (a, b) => toTime(b.updatedAt) - toTime(a.updatedAt),
  );

  return (
    <nav
      aria-label="Chat history"
      className="hidden w-[220px] shrink-0 flex-col gap-3 py-6 pr-2 lg:flex"
    >
      <Link
        className="flex h-11 items-center justify-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 text-sm font-semibold text-[var(--color-ink-900)] transition-colors duration-150 ease-out hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ink-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        href="/cxc-ai"
      >
        New chat
      </Link>

      <div className="flex flex-col">
        <h2 className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-500)]">
          Recent
        </h2>
        {sorted.length === 0 ? (
          <p className="px-1 text-xs text-[var(--color-ink-500)]">
            No past chats yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sorted.map((session) => {
              const active = session.id === activeChatId;
              return (
                <li key={session.id}>
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-11 flex-col justify-center rounded-md border-l-[3px] px-3 transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-inset",
                      active
                        ? "border-l-[var(--color-cardinal-500)] bg-[var(--color-ink-50)]"
                        : "border-l-transparent hover:bg-[var(--color-ink-50)]",
                    )}
                    href={`/cxc-ai/${encodeURIComponent(session.id)}`}
                  >
                    <span
                      className={cn(
                        "block truncate text-[13px] leading-tight",
                        active
                          ? "font-semibold text-[var(--color-ink-900)]"
                          : "text-[var(--color-ink-700)]",
                      )}
                    >
                      {session.title || "Untitled chat"}
                    </span>
                    <span className="mt-0.5 truncate text-[11px] text-[var(--color-ink-500)]">
                      {formatRelative(session.updatedAt ?? session.createdAt)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </nav>
  );
}

function extractActiveChatId(pathname: string): string | null {
  const match = pathname.match(/^\/cxc-ai\/([^/?#]+)/);
  const raw = match?.[1];
  if (!raw) {
    return null;
  }
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function toTime(value: string | undefined): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function formatRelative(iso: string): string {
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) {
    return "";
  }

  const diffMs = Date.now() - time;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWk = Math.floor(diffDay / 7);
  if (diffWk < 5) return `${diffWk}w ago`;
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return `${diffMo}mo ago`;
  const diffYr = Math.floor(diffDay / 365);
  return `${diffYr}y ago`;
}

export default ChatHistoryRail;
