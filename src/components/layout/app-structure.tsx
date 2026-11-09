"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { BrandProvider } from "@/contexts/BrandContext";
import { DeviceProvider } from "@/contexts/DeviceContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { SystemProvider} from "@/contexts/SystemContext";
import { ChatFab } from "@/components/chat/chat-fab";
import { Footer as LayoutFooter } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { MainContent } from "@/components/layout/main-content";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { SystemBackHandler } from "@/components/system-back-handler";
import { ConfirmHost } from "@/components/ui/confirm-dialog";
import { Toaster } from "@/components/ui/toaster";

export default function AppStructure({ children }: { children: React.ReactNode }) {
  return (
    // BrandProvider envolve o ThemeProvider: a marca (whitelabel) é a ENTRADA das
    // cores; o ThemeProvider continua a fonte única que aplica/persiste — ele
    // consome `useBrand()`, não o contrário.
    <BrandProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <DeviceProvider>
                {/* Chat: estado único do assistente; o balão é a região `chat`.
                    Fica acima da Navigation, que tira o chat do menu sem a URL. */}
                <ChatProvider>
                {/* System resolve o layout lendo Device + sessão (Auth) + rota;
                    Navigation não decide layout. A ordem aqui é indiferente. */}
                <NavigationProvider>
                  <SystemProvider>
                      <div data-layout-structure className="flex h-dvh flex-col overflow-hidden bg-background">
                          <Header />
                          <div data-layout-body className="flex min-h-0 flex-1 flex-col">
                              <div data-layout-body-inner className="relative flex min-h-0 flex-1 w-full items-stretch">
                                  <LeftSidebar />
                                  <MainContent>
                                      {/* Coluna flex: repassa a altura do scroll às telas
                                          (zonas de ergonomia — ScreenZones). */}
                                      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
                                  </MainContent>
                                  <RightSidebar />
                                  {/* Região `chat`: flutua no canto do corpo, acima do footer. */}
                                  <ChatFab />
                              </div>
                          </div>
                          <LayoutFooter />
                          {/* Camadas globais: aviso rápido, confirmação e voltar do sistema. */}
                          <Toaster />
                          <ConfirmHost />
                          <SystemBackHandler />
                      </div>
                  </SystemProvider>
                </NavigationProvider>
                </ChatProvider>
            </DeviceProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrandProvider>
  );
}
