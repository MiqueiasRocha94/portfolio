import type { Metadata, Viewport } from "next";
import { Chakra_Petch, JetBrains_Mono, Manrope } from "next/font/google";
import Script from "next/script";

import "@/app/globals.css";
import { activeBrand } from "@/config/brand";
import { TooltipProvider } from "@/components/tooltip";
import AppStructure from "@/components/layout/app-structure";
import { VIEW_BOOTSTRAP_SCRIPT } from "@/lib/platform/view";
import { THEME_BOOTSTRAP_CSS, THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme/theme-bootstrap";

// O app (build mobile) lê os endereços públicos do `app-config.js` do pacote (src/lib/env/runtime-config.ts).
const LOADS_APP_CONFIG = process.env.NEXT_PUBLIC_BUILD_TARGET === "mobile";

// Fonte padrão do sistema (whitelabel-agnóstica): self-hosted pelo next/font, então
// renderiza IGUAL em todo dispositivo (web/Android/iOS) e funciona offline no APK.
// Exposta como `--font-manrope-web`; o preset de fonte decide se usa ela, a fonte do
// SO ou a serifada (ver tokens.css / ThemeProvider).
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope-web", display: "swap" });
// Identidade do portfólio público (`.font-display`/`.font-code`, src/styles/portfolio.css).
const chakraPetch = Chakra_Petch({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display", display: "swap" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-code", display: "swap" });

// Título + favicon vêm da marca ativa do build (whitelabel). No dev, o switcher
// atualiza o favicon em runtime via BrandContext.
export const metadata: Metadata = {
  title: activeBrand.name,
  description: "Miqueias Rocha — Tech Lead, Java Full Stack e IA aplicada.",
  icons: activeBrand.favicon ? { icon: activeBrand.favicon } : undefined,
};

// `viewport-fit=cover`: a página ocupa também a área das barras do SO (o APK já é
// edge-to-edge); header e footer pintam essas faixas (`--app-safe-*`, globals.css).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // `data-view` é escrito pelo script pré-pintura (antes da hidratação), por isso
    // o <html> do servidor não o tem — suppressHydrationWarning cobre só este nó.
    <html lang="pt-BR" className={`${manrope.variable} ${chakraPetch.variable} ${jetBrainsMono.variable}`} suppressHydrationWarning>
      <head>
        {/* `beforeInteractive`: executa antes de qualquer módulo do Next. */}
        {LOADS_APP_CONFIG ? <Script src="/app-config.js" strategy="beforeInteractive" /> : null}
        <script dangerouslySetInnerHTML={{ __html: VIEW_BOOTSTRAP_SCRIPT }} />
        {/* Cores da marca + preferências de tema ANTES da primeira pintura (sem
            o "pisca" dos tokens genéricos até o ThemeProvider hidratar). */}
        <style dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body>
        <TooltipProvider>
          <AppStructure>{children}</AppStructure>
        </TooltipProvider>
      </body>
    </html>
  );
}
