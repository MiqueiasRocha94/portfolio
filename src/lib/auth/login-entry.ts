import { getSessionItem, removeSessionItem, setSessionItem } from "@/lib/platform/storage";

/**
 * Entrada no login só pelo botão da home (docs/autenticacao-e-permissoes.md →
 * "Sessão e fluxo de acesso"). O botão marca a aba; `/login` sem a marca e sem
 * sessão volta para `/`. A marca vive na sessão da aba (sobrevive ao recarregar)
 * e sai depois do login.
 */
const LOGIN_ENTRY_KEY = "mr_login_entry";

export function markLoginEntry() {
  setSessionItem(LOGIN_ENTRY_KEY, "1");
}

export function hasLoginEntry(): boolean {
  return getSessionItem(LOGIN_ENTRY_KEY) === "1";
}

export function clearLoginEntry() {
  removeSessionItem(LOGIN_ENTRY_KEY);
}
