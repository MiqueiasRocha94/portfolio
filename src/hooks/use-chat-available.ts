"use client";

import { useChatContext } from "@/contexts/ChatContext";

/**
 * O chat está ligado na área atual? Sem a raiz da API do assistente, o balão, os
 * itens de menu e as telas de chat saem (docs/integracoes.md → "API do assistente
 * (chat)"). `null` enquanto o portal resolve a raiz.
 */
export function useChatAvailable(): boolean | null {
  const { chatUrl } = useChatContext();
  return chatUrl === null ? null : chatUrl !== "";
}
