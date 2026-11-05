"use client";

import { useCallback } from "react";

import { useChatContext } from "@/contexts/ChatContext";
import type { ChatAudience } from "@/types/chat";

/**
 * Conversa de um público com o assistente (Uriel), lida do `ChatContext`: o
 * mesmo histórico e status em todas as telas que o mostram.
 */
export function useChat(audience: ChatAudience) {
  const { messages, online, sending, send } = useChatContext();
  const sendText = useCallback((text: string) => send(audience, text), [audience, send]);
  return { messages: messages[audience], online: online === true, sending: sending[audience], send: sendText };
}
