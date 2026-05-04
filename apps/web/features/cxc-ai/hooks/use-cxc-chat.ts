"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo } from "react";

import type { CxcMessageDto } from "@/server/http/contracts";

type UseCxcChatArgs = {
  chatId: string;
  initialMessages: CxcMessageDto[];
};

/**
 * Wraps the AI SDK's `useChat` with the CXC streaming transport.
 *
 * Durable persistence is owned by the server: `/api/cxc-ai` writes the
 * assistant turn (messages + sources) on stream completion via the AI SDK
 * `onFinish` callback. The client no longer needs to post the finished
 * messages back — closing the tab mid-stream still lands the assistant
 * turn in Postgres.
 */
export function useCxcChat({ chatId, initialMessages }: UseCxcChatArgs) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/cxc-ai",
        prepareSendMessagesRequest({ id, messages }) {
          return { body: { id, messages } };
        },
      }),
    [],
  );

  const chat = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
  });

  return chat;
}

export type UseCxcChatReturn = ReturnType<typeof useCxcChat>;
