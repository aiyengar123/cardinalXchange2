import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CxcMessageDto } from "@/backend/http/contracts";

const routerReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace, push: vi.fn() }),
}));

const useCxcChatMock = vi.fn();
vi.mock("@/features/cxc-ai/hooks/use-cxc-chat", () => ({
  useCxcChat: (args: unknown) => useCxcChatMock(args),
}));

vi.mock("@/features/cxc-ai/hooks/use-stick-to-bottom", () => ({
  useStickToBottom: () => ({ isAtBottom: true, scrollToBottom: vi.fn() }),
}));

import { ChatShell } from "../chat-shell";

function message(role: "user" | "assistant", text: string): CxcMessageDto {
  return {
    id: `m-${role}`,
    role,
    parts: [{ type: "text", text }],
  } as unknown as CxcMessageDto;
}

function chatState(messages: CxcMessageDto[]) {
  return {
    error: undefined,
    messages,
    regenerate: vi.fn(),
    sendMessage: vi.fn(),
    status: "submitted",
    stop: vi.fn(),
  };
}

beforeEach(() => {
  routerReplace.mockClear();
  useCxcChatMock.mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ChatShell new-chat URL swap", () => {
  // Regression: a `router.replace()` here server-renders /cxc-ai/[chatId]
  // and races `ensureAiChatSession`'s insert — in prod the page render wins
  // and the user gets a 404 mid-conversation. The URL must change via a
  // shallow `history.replaceState` only.
  it("swaps the URL with history.replaceState (no router navigation) once a user message exists", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    useCxcChatMock.mockReturnValue(chatState([message("user", "hi")]));

    render(<ChatShell chatId="chat-123" initialMessages={[]} isNewChat />);

    expect(replaceState).toHaveBeenCalledWith(null, "", "/cxc-ai/chat-123");
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("does not touch the URL before the first user message", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    useCxcChatMock.mockReturnValue(chatState([]));

    render(<ChatShell chatId="chat-123" initialMessages={[]} isNewChat />);

    expect(replaceState).not.toHaveBeenCalled();
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("does not touch the URL when rendering an existing chat", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    useCxcChatMock.mockReturnValue(chatState([message("user", "hi")]));

    render(
      <ChatShell chatId="chat-123" initialMessages={[message("user", "hi")]} />,
    );

    expect(replaceState).not.toHaveBeenCalled();
    expect(routerReplace).not.toHaveBeenCalled();
  });
});
