"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getNavigationArea } from "@/lib/navigation";
import { getSessionItem, setSessionItem } from "@/lib/platform/storage";
import { askChat, isChatOnline, loadPublicChatUrl } from "@/services/chat";
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
  /** Raiz da API do assistente na área atual; `""` = chat desligado; `null` enquanto o portal a resolve. */
  chatUrl: string | null;
  /** Status do assistente; `null` enquanto a primeira verificação não volta. */
  online: boolean | null;
  messages: ByAudience<ChatMessage[]>;
  sending: ByAudience<boolean>;
  send: (audience: ChatAudience, text: string) => Promise<void>;
  /** Entrega a raiz do portal; só o layout do portal chama. */
  setPortalChatUrl: (url: string) => void;
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
 * Estado único da conversa com o assistente (Uriel), para o app inteiro: a raiz
 * da API na área atual, uma verificação de status e o histórico da sessão por
 * público. No portfólio a raiz vem de `/config/chat`; no portal, o layout do
 * portal a entrega por `setPortalChatUrl` (o portfólio não lê config privada). O balão (região `chat` do shell), o menu, o `/chat`, o chat do portal
 * e o painel leem daqui (docs/integracoes.md → "API do assistente (chat)").
 * Sem raiz, o chat fica desligado e não há verificação de status.
 */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { dictionary } = useLanguage();
  const texts = dictionary.chat;
  const token = useAuth().session?.accessToken ?? null;
  const inPortal = getNavigationArea(usePathname()) === "portal";
  const loggedIn = Boolean(token);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  // Sessão encerrada: a raiz do portal é buscada de novo no próximo login.
  const [wasLoggedIn, setWasLoggedIn] = useState(loggedIn);
  if (wasLoggedIn !== loggedIn) {
    setWasLoggedIn(loggedIn);
    if (!loggedIn) setPortalUrl(null);
  }
  // Raiz do portfólio: buscada uma vez, na primeira tela fora do portal.
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const chatUrl = inPortal ? (loggedIn ? portalUrl : "") : publicUrl;
  const [messages, setMessages] = useState<ByAudience<ChatMessage[]>>(() => ({
    admin: readHistory("admin"),
    visitante: readHistory("visitante"),
  }));
  // Última verificação de status, da raiz em que foi feita (trocar de área recomeça).
  const [health, setHealth] = useState<{ url: string; up: boolean } | null>(null);
  const online = chatUrl === "" ? false : health && health.url === chatUrl ? health.up : null;
  const [sending, setSending] = useState<ByAudience<boolean>>({ admin: false, visitante: false });
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
    for (const audience of AUDIENCES) {
      setSessionItem(storageKey(audience), JSON.stringify(messages[audience]));
    }
  }, [messages]);

  const needsPublicUrl = !inPortal && publicUrl === null;
  useEffect(() => {
    if (!needsPublicUrl) return;
    let alive = true;
    void loadPublicChatUrl().then((url) => {
      if (alive) setPublicUrl(url);
    });
    return () => {
      alive = false;
    };
  }, [needsPublicUrl]);

  useEffect(() => {
    if (!chatUrl) return;
    let timeout: ReturnType<typeof setTimeout>;
    let failures = 0;
    let alive = true;

    const check = async () => {
      let up = false;
      try {
        up = await isChatOnline(chatUrl);
      } catch {
        up = false;
      }
      if (!alive) return;
      setHealth({ url: chatUrl, up });
      failures = up ? 0 : failures + 1;
      timeout = setTimeout(check, up ? HEALTH_OK_MS : HEALTH_RETRY_MS[Math.min(failures, HEALTH_RETRY_MS.length) - 1]);
    };
    void check();

    return () => {
      alive = false;
      clearTimeout(timeout);
    };
  }, [chatUrl]);

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
      if (!online || !chatUrl) {
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
        const reply = await askChat(chatUrl, question, previous, audience);
        push(audience, { text: reply || texts.noReply, fromUser: false });
      } catch {
        push(audience, { text: texts.error, fromUser: false });
      } finally {
        setSending((prev) => ({ ...prev, [audience]: false }));
      }
    },
    [chatUrl, online, push, texts],
  );

  const value = useMemo(
    () => ({ chatUrl, online, messages, sending, send, setPortalChatUrl: setPortalUrl }),
    [chatUrl, online, messages, sending, send],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext deve ser usado dentro de ChatProvider.");
  }
  return context;
}
