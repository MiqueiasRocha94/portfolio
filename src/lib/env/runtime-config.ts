/**
 * Endereços públicos lidos em runtime (docs/ambiente-e-build.md → "Atualização remota do app").
 *
 * O build mobile grava `app-config.js` no `out/` (scripts/app-config.mjs), carregado antes do app, e
 * ele entra no pacote assinado da atualização remota: trocar de domínio é publicar um pacote, sem APK
 * novo. Valor ausente ou vazio no arquivo — ou a web, que não o carrega — cai no valor do build.
 * A raiz do chat não passa por aqui: vem do servidor em runtime (src/services/chat.ts).
 */

export type RuntimeConfigKey = "acessoApiUrl" | "apiBaseUrl" | "appUpdateUrl";

declare global {
  interface Window {
    __APP_CONFIG__?: Partial<Record<RuntimeConfigKey, unknown>>;
  }
}

// Acesso literal: o Next só embute `process.env.NEXT_PUBLIC_*` escrito assim. O valor de build de
// `appUpdateUrl` fica no módulo src/app-update (removido do artefato sem a atualização remota).
const BUILD_CONFIG: Partial<Record<RuntimeConfigKey, string>> = {
  acessoApiUrl: process.env.NEXT_PUBLIC_ACESSO_API_URL ?? "",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
};

/** Endereço público: o do `app-config.js` do pacote, se houver; senão, o do build (`buildValue`). */
export function runtimeUrl(key: RuntimeConfigKey, buildValue = BUILD_CONFIG[key] ?? ""): string {
  const value = typeof window === "undefined" ? undefined : window.__APP_CONFIG__?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : buildValue;
}
