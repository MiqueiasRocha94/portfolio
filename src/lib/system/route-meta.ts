import { usePathname } from "next/navigation";

/**
 * Metadata de LAYOUT declarada pela rota (§5.2). O resolver interpreta o token
 * genérico (`minimal`/`default`) — ele NÃO conhece rotas. Substitui a antiga
 * lista `PUBLIC_AUTH_ROUTES` embutida na resolução.
 */
/**
 * Tokens de layout (presets de região resolvidos em resolve-system-config):
 * - `default`: segue a config (chrome completo);
 * - `minimal`: só `main` (sem header/sidebar-esq/footer);
 * - `basic`  : header + main;
 * - `mobile` : header + main + footer.
 */
export type RouteLayout = "default" | "minimal" | "basic" | "mobile";

/**
 * `layout` vale para todos os tamanhos; `mobileLayout` (opcional) o substitui
 * quando o device é mobile — permite, ex., desktop `minimal` + mobile `mobile`.
 * `bare`: o conteúdo fica "nu" (sem top bar, padding nem card) mesmo com
 * header/footer — página com mais liberdade de design dentro do shell.
 * `chat: false`: a rota tira o balão do assistente (região `chat`).
 */
export type RouteMeta = { layout?: RouteLayout; mobileLayout?: RouteLayout; bare?: boolean; chat?: boolean };

/** Metadata já resolvida (layout com default aplicado; o resto passa direto). */
export type ResolvedRouteMeta = { layout: RouteLayout; mobileLayout?: RouteLayout; bare?: boolean; chat?: boolean };

/**
 * Registro pathname → meta. Primeiro passo: um mapa central; a evolução natural é
 * co-locar `export const meta` em cada `page.tsx`.
 * - home (`/`) e login: `minimal`, páginas livres com a moldura própria;
 * - demais páginas do portfólio: header do shell (barra inferior no mobile) com
 *   o conteúdo `bare`; `/chat` já é a conversa, sem o balão;
 * - portal: `default` (chrome completo); o chat do portal também tira o balão.
 */
const PORTFOLIO_PAGE: RouteMeta = { layout: "basic", mobileLayout: "mobile", bare: true };

const ROUTE_META: Record<string, RouteMeta> = {
  "/": { layout: "minimal" },
  "/sobre-mim": PORTFOLIO_PAGE,
  "/chat": { ...PORTFOLIO_PAGE, chat: false },
  "/login": { layout: "minimal" },
  "/portal/chat": { chat: false },
};

const DEFAULT_META: ResolvedRouteMeta = { layout: "default" };

/** Resolve a metadata da rota. Função PURA — casa com o `pathname` exato. */
export function getRouteMeta(pathname: string): ResolvedRouteMeta {
  return { ...DEFAULT_META, ...ROUTE_META[pathname] };
}

/** Leitor da metadata da rota atual (para consumidores que não têm o pathname). */
export function useRouteMeta(): ResolvedRouteMeta {
  return getRouteMeta(usePathname());
}
