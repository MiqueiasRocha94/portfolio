"use client";

import { ChatPanel } from "@/components/chat/chat-panel";
import { ScreenLayout } from "@/components/layout/screen-layout";
import { NotFoundContent } from "@/components/not-found-content";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChatAvailable } from "@/hooks/use-chat-available";

/**
 * Chat público com o Uriel (`/chat`); header e barra inferior vêm do shell (RouteMeta).
 * Sem a URL do assistente, a rota mostra o 404.
 */
export function PublicChatScreen() {
  const { dictionary } = useLanguage();
  if (!useChatAvailable()) return <NotFoundContent />;
  return (
    <ScreenLayout title={dictionary.nav.uriel}>
      <div className="flex min-h-0 flex-1 flex-col bg-background text-text">
        <ChatPanel audience="visitante" variant="portfolio" />
      </div>
    </ScreenLayout>
  );
}
