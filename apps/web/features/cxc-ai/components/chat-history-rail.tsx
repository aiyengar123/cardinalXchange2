"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@cardinalxchange/ui";

import type { AiChatSession } from "@/server/http/contracts";

type ChatHistoryRailProps = {
  sessions: AiChatSession[];
};

type GroupKey = "today" | "week" | "older";

type GroupedSession = {
  session: AiChatSession;
  timestamp: number;
};

const RAIL_SESSION_LIMIT = 25;
const DAY_MS = 24 * 60 * 60 * 1000;

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
  const visible = sorted.slice(0, RAIL_SESSION_LIMIT);
  const overflow = Math.max(0, sorted.length - visible.length);

  const now = new Date();
  const groups = groupSessions(visible, now);

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

      {visible.length === 0 ? (
        <div className="flex flex-col">
          <p className="px-1 text-xs text-[var(--color-ink-500)]">
            No past chats yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <div key={group.key} className="flex flex-col">
              <h2 className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-500)]">
                {group.label}
              </h2>
              <ul className="flex flex-col gap-1">
                {group.items.map(({ session, timestamp }) => {
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
                          {formatBucketTime(group.key, timestamp, now)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {overflow > 0 ? (
            <p className="mt-1 px-1 text-[11px] text-[var(--color-ink-500)]">
              + {overflow} older
            </p>
          ) : null}
        </div>
      )}
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

type SessionGroup = {
  key: GroupKey;
  label: string;
  items: GroupedSession[];
};

function groupSessions(
  sessions: AiChatSession[],
  now: Date,
): SessionGroup[] {
  const today: GroupedSession[] = [];
  const week: GroupedSession[] = [];
  const older: GroupedSession[] = [];

  const nowTime = now.getTime();
  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();

  for (const session of sessions) {
    const iso = session.updatedAt || session.createdAt;
    const timestamp = toTime(iso);
    if (!timestamp) {
      older.push({ session, timestamp });
      continue;
    }
    const date = new Date(timestamp);
    const diffMs = nowTime - timestamp;
    const sameCalendarDay =
      date.getFullYear() === todayY &&
      date.getMonth() === todayM &&
      date.getDate() === todayD;

    if (diffMs < DAY_MS && diffMs >= 0 && sameCalendarDay) {
      today.push({ session, timestamp });
    } else if (diffMs < 7 * DAY_MS && diffMs >= 0) {
      week.push({ session, timestamp });
    } else {
      older.push({ session, timestamp });
    }
  }

  const groups: SessionGroup[] = [];
  if (today.length > 0) {
    groups.push({ key: "today", label: "Today", items: today });
  }
  if (week.length > 0) {
    groups.push({ key: "week", label: "Last 7 Days", items: week });
  }
  if (older.length > 0) {
    groups.push({ key: "older", label: "Older", items: older });
  }
  return groups;
}

function formatBucketTime(
  key: GroupKey,
  timestamp: number,
  now: Date,
): string {
  if (!timestamp) {
    return "";
  }
  const date = new Date(timestamp);
  if (key === "today") {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }
  if (key === "week") {
    return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
      date,
    );
  }
  const monthDay = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
  const ageMs = now.getTime() - timestamp;
  if (ageMs > 365 * DAY_MS) {
    const year = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
    }).format(date);
    return `${monthDay}, ${year}`;
  }
  return monthDay;
}

export default ChatHistoryRail;
