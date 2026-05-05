import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AiChatSession } from "@/backend/http/contracts";

vi.mock("next/navigation", () => ({
  usePathname: () => "/cxc-ai/session-2",
}));

import { ChatHistoryRail } from "../chat-history-rail";

afterEach(() => {
  cleanup();
});

function session(overrides: Partial<AiChatSession> = {}): AiChatSession {
  const now = new Date().toISOString();
  return {
    id: "session-1",
    title: "First chat",
    createdAt: now,
    updatedAt: now,
    messageCount: 1,
    ...overrides,
  };
}

describe("ChatHistoryRail", () => {
  it("renders the empty state copy when no sessions are passed", () => {
    render(<ChatHistoryRail sessions={[]} />);
    expect(screen.getByText(/No past chats yet/)).toBeInTheDocument();
    // The "New chat" CTA still links out
    expect(
      screen.getByRole("link", { name: "New chat" }).getAttribute("href"),
    ).toBe("/cxc-ai");
  });

  it("marks the active session (matching pathname) with aria-current='page'", () => {
    const today = new Date().toISOString();
    render(
      <ChatHistoryRail
        sessions={[
          session({
            id: "session-1",
            title: "Chat 1",
            updatedAt: today,
          }),
          session({
            id: "session-2",
            title: "Chat 2",
            updatedAt: today,
          }),
        ]}
      />,
    );

    const active = screen.getByRole("link", { name: /Chat 2/ });
    expect(active.getAttribute("aria-current")).toBe("page");

    const inactive = screen.getByRole("link", { name: /Chat 1/ });
    expect(inactive.getAttribute("aria-current")).toBeNull();
  });
});
