"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { NAV_ICONS } from "@/components/navigation/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useDevice } from "@/contexts/DeviceContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAppNavigationItems, type NavigationItem } from "@/lib/navigation";
import { resolveLabel } from "@/lib/navigation-helpers";
import { cn } from "@/lib/utils";

/** Espaço da barra inferior no mobile, para o conteúdo não ficar por baixo dela. */
export const PUBLIC_BOTTOM_NAV_SPACE = "mobile:pb-[calc(var(--app-safe-bottom,0px)+5rem)]";

/** Entrada do portal na navegação pública (Login sem sessão, Painel com sessão). */
const ENTRY_HREFS = new Set(["/login", "/portal/home"]);

/**
 * Navegação da home, que é página livre (`minimal`) e desenha a própria moldura.
 * Os itens são os mesmos do shell nas demais páginas públicas
 * (`getAppNavigationItems(..., "public")`, docs/navegacao.md).
 */
function useHomeNavigation(): { links: NavigationItem[]; entry: NavigationItem | null } {
  const { session, user } = useAuth();
  const items = getAppNavigationItems(Boolean(session), user, "public");
  return {
    links: items.filter((item) => !ENTRY_HREFS.has(item.href)),
    entry: items.find((item) => ENTRY_HREFS.has(item.href)) ?? null,
  };
}

/**
 * Cabeçalho da home, fixo no topo durante a rolagem. Desktop: flutua no canto
 * (nav + entrada + idioma).
 * Mobile: só o idioma; a navegação fica na barra inferior (`HomeBottomNav`).
 */
export function PublicHeader() {
  const pathname = usePathname();
  const { view } = useDevice();
  const { dictionary } = useLanguage();
  const { links, entry } = useHomeNavigation();

  if (view === "mobile") {
    return (
      <header className="fixed right-0 top-0 z-30 flex items-center px-4 pt-[calc(var(--app-safe-top,0px)+1rem)]">
        <LocaleSwitcher menu />
      </header>
    );
  }

  return (
    <header className="fixed right-6 top-6 z-30 flex items-center gap-2">
      <nav aria-label={dictionary.nav.title} className="font-display flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-on-overlay/70">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={item.onSelect}
            aria-current={pathname === item.href ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-2 transition",
              pathname === item.href ? "bg-primary/15 text-primary" : "hover:bg-on-overlay/10 hover:text-on-overlay",
            )}
          >
            {resolveLabel(item, dictionary)}
          </Link>
        ))}
      </nav>
      {entry ? (
        <Link
          href={entry.href}
          onClick={entry.onSelect}
          className="font-display rounded-full border border-primary/40 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-primary transition hover:border-primary hover:text-primary-strong"
        >
          {resolveLabel(entry, dictionary)}
        </Link>
      ) : null}
      <LocaleSwitcher menu />
    </header>
  );
}

/** Barra inferior da home no mobile: destinos + entrada do portal. */
export function HomeBottomNav() {
  const pathname = usePathname();
  const { view } = useDevice();
  const { dictionary } = useLanguage();
  const { links, entry } = useHomeNavigation();
  if (view !== "mobile") {
    return null;
  }
  const items = entry ? [...links, entry] : links;

  return (
    // `data-page-bottom-nav`: o balão do chat (região `chat`) sobe acima desta barra.
    <nav
      data-page-bottom-nav
      aria-label={dictionary.nav.title}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-left-sidebar-border bg-left-sidebar-background/95 pb-[var(--app-safe-bottom,0px)] backdrop-blur"
    >
      <div className="grid gap-1 px-2 py-2" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={item.onSelect}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-xs font-medium transition",
                active ? "bg-primary text-on-primary" : "text-left-sidebar-foreground hover:bg-left-sidebar-foreground/5",
              )}
            >
              <span aria-hidden="true" className="flex size-5 items-center justify-center">
                {NAV_ICONS[item.icon]}
              </span>
              <span className="max-w-full truncate">{resolveLabel(item, dictionary)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
