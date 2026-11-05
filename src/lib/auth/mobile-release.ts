import release from "@/config/mobile-release.json";
import webRelease from "@/config/web-release.json";
import { hasAnyRole } from "@/lib/auth/user";
import type { Role, User } from "@/types/user";

/**
 * Páginas e perfis publicados (docs/ambiente-e-build.md → "Páginas publicadas no app"
 * e "Páginas publicadas na web").
 * Só o APK e a web de homologação/produção restringem, cada um pela sua lista; no
 * desenvolvimento (`npm run dev` e APK debug, para testar o que ainda não saiu)
 * tudo continua liberado. Lista vazia (rotas ou perfis) = sem restrição. As
 * páginas fora da lista já saem do artefato no build; aqui o menu e o gate
 * deixam de oferecê-las. Perfis só se restringem no app.
 */
const IS_DIST_BUILD = process.env.NEXT_PUBLIC_APP_ENV !== "development";
const IS_APP_BUILD = process.env.NEXT_PUBLIC_BUILD_TARGET === "mobile" && IS_DIST_BUILD;
const IS_WEB_BUILD = process.env.NEXT_PUBLIC_BUILD_TARGET === "web" && IS_DIST_BUILD;
const RELEASED_ROUTES = new Set<string>(IS_WEB_BUILD ? webRelease.routes : release.routes);
const RELEASED_PROFILES = release.profiles as Role[];

/** Verdadeiro se a rota está publicada no alvo do build (sempre verdadeiro no desenvolvimento). */
export function isRouteReleased(pathname: string): boolean {
  if (!(IS_APP_BUILD || IS_WEB_BUILD) || RELEASED_ROUTES.size === 0) {
    return true;
  }
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return RELEASED_ROUTES.has(path);
}

/**
 * Verdadeiro se o perfil do usuário está liberado no app. Sessão ainda sem
 * perfil passa: o bloqueio vem com a sessão completa.
 */
export function isProfileReleased(user: User | null): boolean {
  if (!IS_APP_BUILD || RELEASED_PROFILES.length === 0 || !user?.authorization.roles.length) {
    return true;
  }
  return hasAnyRole(user, RELEASED_PROFILES);
}

// Aviso para o login depois que o gate encerra a sessão de um perfil bloqueado.
let profileBlocked = false;

export function markProfileBlocked() {
  profileBlocked = true;
}

export function hasProfileBlockedNotice(): boolean {
  return profileBlocked;
}

export function clearProfileBlockedNotice() {
  profileBlocked = false;
}
