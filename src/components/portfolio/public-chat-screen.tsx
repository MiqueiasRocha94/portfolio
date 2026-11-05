"use client";

import { ChatPanel } from "@/components/chat/chat-panel";
import { ScreenLayout } from "@/components/layout/screen-layout";
import { useLanguage } from "@/contexts/LanguageContext";

/** Chat público com o Uriel (`/chat`); header e barra inferior vêm do shell (RouteMeta). */
export function PublicChatScreen() {
  const { dictionary } = useLanguage();
  return (
    <ScreenLayout title={dictionary.nav.uriel}>
      <div className="flex min-h-0 flex-1 flex-col bg-background text-text">
        <ChatPanel audience="visitante" variant="portfolio" />
      </div>
    </ScreenLayout>
  );
}
