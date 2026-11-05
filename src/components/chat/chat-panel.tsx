"use client";

import { useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";

import { useLanguage } from "@/contexts/LanguageContext";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import type { ChatAudience } from "@/types/chat";

/**
 * Conversa com o Uriel. `portfolio`: tom forte da marca (portfólio público);
 * `portal`: tokens do tema, dentro do shell do portal.
 */
type Variant = "portfolio" | "portal";

const STYLES: Record<Variant, { title: string; border: string; input: string; button: string; user: string; bot: string; source: string }> = {
  portfolio: {
    title: "text-primary",
    border: "border-primary-strong",
    input: "border-primary-strong bg-background text-text placeholder:text-text-muted",
    button: "bg-primary-strong text-on-primary-strong hover:bg-primary hover:text-on-primary",
    user: "bg-primary-strong text-on-primary-strong",
    bot: "border border-primary-strong bg-surface text-text",
    source: "border-primary-strong bg-background",
  },
  portal: {
    title: "text-primary",
    border: "border-border",
    input: "border-border bg-surface text-text placeholder:text-text-muted",
    button: "bg-primary text-on-primary hover:bg-primary-strong",
    user: "bg-primary text-on-primary",
    bot: "border border-border bg-surface text-text",
    source: "border-border bg-background",
  },
};

export function ChatPanel({ audience, variant }: { audience: ChatAudience; variant: Variant }) {
  const { dictionary } = useLanguage();
  const t = dictionary.chat;
  const { messages, online, sending, send } = useChat(audience);
  const [input, setInput] = useState("");
  const [sourceOf, setSourceOf] = useState<string | null>(null);
  const s = STYLES[variant];
  const showWelcome = audience === "visitante" && messages.length === 0;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const text = input;
    setInput("");
    await send(text);
  };

  const form = (rounded: string) => (
    <form onSubmit={onSubmit} className="flex w-full gap-3">
      <input
        className={cn("min-w-0 flex-1 border p-3 outline-none", rounded, s.input)}
        placeholder={t.placeholder}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        disabled={sending}
        aria-label={t.placeholder}
      />
      <button type="submit" disabled={sending || !input.trim()} className={cn("px-5 disabled:opacity-60", rounded, s.button)}>
        {sending ? t.sending : t.send}
      </button>
    </form>
  );

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-center">
      <div className={cn("flex w-full max-w-5xl items-center gap-2 border-b px-6 py-4", s.border)}>
        <h1 className={cn("font-semibold", s.title)}>{audience === "admin" ? t.titleAdmin : t.titleVisitor}</h1>
        <span
          className={cn("size-2.5 rounded-full", online ? "bg-success" : "bg-error")}
          title={online ? t.online : t.offlineStatus}
          aria-label={online ? t.online : t.offlineStatus}
        />
      </div>

      <div className="flex min-h-0 w-full max-w-5xl flex-1 flex-col px-6">
        {showWelcome ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 py-10 text-center">
            <div>
              <h2 className={cn("mb-4 text-3xl font-bold", s.title)}>{t.greeting}</h2>
              <p className="max-w-xl opacity-80">{t.intro}</p>
            </div>
            <div className="w-full max-w-xl">{form("rounded-full")}</div>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-6 overflow-y-auto py-6">
              {messages.map((message) =>
                message.fromUser ? (
                  <div key={message.id} className="flex justify-end">
                    <div className={cn("max-w-xl rounded-lg p-4", s.user)}>{message.text}</div>
                  </div>
                ) : (
                  <div key={message.id} className="flex justify-start">
                    <div className={cn("max-w-2xl rounded-lg p-4", s.bot)}>
                      <div className="space-y-2 [&_code]:font-mono [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_ul]:list-disc [&_ul]:pl-5">
                        <ReactMarkdown>{message.text}</ReactMarkdown>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSourceOf(sourceOf === message.id ? null : message.id)}
                        className={cn("mt-3 text-sm", s.title)}
                      >
                        {sourceOf === message.id ? t.hideSource : t.showSource}
                      </button>
                      {sourceOf === message.id && (
                        <pre className={cn("mt-3 overflow-x-auto whitespace-pre-wrap border p-3 text-sm", s.source)}>{message.text}</pre>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
            <div className={cn("border-t py-4", s.border)}>{form("rounded-lg")}</div>
          </>
        )}
      </div>
    </div>
  );
}
