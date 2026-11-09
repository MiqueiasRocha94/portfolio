"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, SendHorizontal, X } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { useSystemContext } from "@/contexts/SystemContext";
import { useChat } from "@/hooks/use-chat";
import { useChatAvailable } from "@/hooks/use-chat-available";
import { getNavigationArea } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Mensagens visíveis no balão (a conversa completa fica em `/chat`). */
const VISIBLE_MESSAGES = 6;
const PREVIEW_CHARS = 180;

/**
 * Região `chat` do shell (docs/shell-adaptativo.md): balão flutuante do Uriel.
 * O SystemContext decide se aparece (config `chatVisible` + `RouteMeta.chat`).
 * Fica no canto do corpo do shell, acima do footer; uma barra inferior própria
 * da página (`data-page-bottom-nav`, ex.: a home) o empurra para cima. No
 * portfólio conversa como visitante (histórico do `/chat`); no portal, como
 * administrador (histórico do chat do portal). Sem a URL do assistente, não aparece.
 */
export function ChatFab() {
  const { layout } = useSystemContext();
  const pathname = usePathname();
  const available = useChatAvailable();
  if (!layout.chat || !available) {
    return null;
  }
  const audience = getNavigationArea(pathname) === "portal" ? "admin" : "visitante";
  // Sem o footer do shell, o balão fica rente à borda da tela: respeita a área segura.
  return <ChatBubble key={audience} audience={audience} safeBottom={!layout.footer} />;
}

function ChatBubble({ audience, safeBottom }: { audience: "admin" | "visitante"; safeBottom: boolean }) {
  const { dictionary } = useLanguage();
  const t = dictionary.chat;
  const { messages, online, sending, send } = useChat(audience);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const text = input;
    setInput("");
    await send(text);
  };

  return (
    <div
      data-layout-region="chat"
      className={cn(
        "absolute right-5 z-50 flex flex-col items-end [body:has([data-page-bottom-nav])_&]:mobile:bottom-[calc(var(--app-safe-bottom,0px)+6rem)]",
        safeBottom ? "bottom-[calc(var(--app-safe-bottom,0px)+1.25rem)]" : "bottom-5",
      )}
    >
      {open ? (
        <div className="flex h-[420px] w-80 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl animate-[slideUpFade_0.25s_ease]">
          <div className="flex items-center justify-between bg-gradient-to-b from-primary to-primary-strong px-4 py-3 font-semibold text-on-primary">
            <span>{audience === "admin" ? t.titleAdmin : t.titleVisitor}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label={dictionary.common.close} className="transition hover:scale-110">
              <X className="size-5" />
            </button>
          </div>

          <p className={online ? "px-3 py-1 text-xs text-success" : "px-3 py-1 text-xs text-text-muted"}>
            {online ? t.online : t.offlineStatus}
          </p>

          <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto bg-background p-3">
            {messages.slice(-VISIBLE_MESSAGES).map((message) => (
              <div key={message.id} className={`flex flex-col ${message.fromUser ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                    message.fromUser ? "bg-primary text-on-primary" : "bg-surface-strong text-text"
                  }`}
                >
                  {message.text.length > PREVIEW_CHARS ? `${message.text.slice(0, PREVIEW_CHARS)}...` : message.text}
                </div>
                <span className="mt-1 text-[10px] text-text-muted">{message.time}</span>
              </div>
            ))}
          </div>

          <form onSubmit={onSubmit} className="flex border-t border-border">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.placeholder}
              className="min-w-0 flex-1 bg-surface px-3 py-2 text-sm text-text outline-none"
            />
            <button
              type="submit"
              disabled={sending}
              aria-label={t.send}
              className="bg-primary px-4 text-on-primary transition hover:bg-primary-strong disabled:opacity-60"
            >
              <SendHorizontal className="size-4" />
            </button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t.titleVisitor}
          className="flex size-16 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition hover:scale-110"
        >
          <MessageCircle className="size-7" />
        </button>
      )}
    </div>
  );
}
