"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useLanguage } from "@/contexts/LanguageContext";
import { getSessionItem, setSessionItem } from "@/lib/platform/storage";
import { askChat, isChatOnline } from "@/services/chat";
import type { ChatAudience, ChatMessage } from "@/types/chat";

/** Histórico guardado por público (o do portal não aparece no chat público). */
const HISTORY_LIMIT: Record<ChatAudience, number> = { admin: 50, visitante: 10 };
const AUDIENCES: ChatAudience[] = ["admin", "visitante"];
const storageKey = (audience: ChatAudience) => `chat_messages_${audience}`;

// Status do assistente: com ele no ar, confere de novo em 30 min; fora, 1 min,
// depois 10 min e então 30 min.
const HEALTH_OK_MS = 30 * 60 * 1000;
const HEALTH_RETRY_MS = [60 * 1000, 10 * 60 * 1000, 30 * 60 * 1000];

type ByAudience<T> = Record<ChatAudience, T>;

type ChatContextValue = {
  /** Status do assistente; `null` enquanto a primeira verificação não volta. */
  online: boolean | null;
  messages: ByAudience<ChatMessage[]>;
  sending: ByAudience<boolean>;
  send: (audience: ChatAudience, text: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextValue | null>(null);

function readHistory(audience: ChatAudience): ChatMessage[] {
  try {
    const stored = getSessionItem(storageKey(audience));
    return stored ? (JSON.parse(stored) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/**
 * Estado único da conversa com o assistente (Uriel), para o app inteiro: uma
 * verificação de status e o histórico da sessão por público. O balão (região
 * `chat` do shell), o `/chat`, o chat do portal e o painel leem daqui
 * (docs/integracoes.md → "API do assistente (chat)").
 */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { dictionary } = useLanguage();
  const texts = dictionary.chat;
  const [messages, setMessages] = useState<ByAudience<ChatMessage[]>>(() => ({
    admin: readHistory("admin"),
    visitante: readHistory("visitante"),
  }));
  const [online, setOnline] = useState<boolean | null>(null);
  const [sending, setSending] = useState<ByAudience<boolean>>({ admin: false, visitante: false });
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
    for (const audience of AUDIENCES) {
      setSessionItem(storageKey(audience), JSON.stringify(messages[audience]));
    }
  }, [messages]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let failures = 0;
    let alive = true;

    const check = async () => {
      let up = false;
      try {
        up = await isChatOnline();
      } catch {
        up = false;
      }
      if (!alive) return;
      setOnline(up);
      failures = up ? 0 : failures + 1;
      timeout = setTimeout(check, up ? HEALTH_OK_MS : HEALTH_RETRY_MS[Math.min(failures, HEALTH_RETRY_MS.length) - 1]);
    };
    void check();

    return () => {
      alive = false;
      clearTimeout(timeout);
    };
  }, []);

  const push = useCallback(
    (audience: ChatAudience, message: Omit<ChatMessage, "id" | "time">) =>
      setMessages((prev) => ({
        ...prev,
        [audience]: [...prev[audience], { ...message, id: crypto.randomUUID(), time: now() }].slice(-HISTORY_LIMIT[audience]),
      })),
    [],
  );

  const send = useCallback(
    async (audience: ChatAudience, text: string) => {
      const question = text.trim();
      if (!question) return;
      if (!online) {
        push(audience, { text: texts.offline, fromUser: false });
        return;
      }
      const previous = messagesRef.current[audience]
        .filter((message) => !message.fromUser)
        .map((message) => message.text)
        .join("\n");
      push(audience, { text: question, fromUser: true });
      setSending((prev) => ({ ...prev, [audience]: true }));
      try {
        const reply = await askChat(question, previous, audience);
        push(audience, { text: reply || texts.noReply, fromUser: false });
      } catch {
        push(audience, { text: texts.error, fromUser: false });
      } finally {
        setSending((prev) => ({ ...prev, [audience]: false }));
      }
    },
    [online, push, texts],
  );

  const value = useMemo(() => ({ online, messages, sending, send }), [online, messages, sending, send]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext deve ser usado dentro de ChatProvider.");
  }
  return context;
}
