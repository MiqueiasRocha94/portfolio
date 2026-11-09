import { getBiometricPreference, getSession } from "@/lib/auth/session";
import { isBiometricAuthAvailable } from "@/lib/platform/biometrics";
import { isNativePlatform } from "@/lib/platform/capacitor";

export type ProtectedAccessMode = "biometric" | "web-session" | "none";

export async function resolveProtectedAccessMode(): Promise<ProtectedAccessMode> {
  if (!isNativePlatform()) {
    return "web-session";
  }

  const session = getSession();
  if (!session) {
    return "none";
  }

  const available = await isBiometricAuthAvailable();
  const enabled = getBiometricPreference(session.login);
  return available && enabled ? "biometric" : "none";
}

// "Sair" do menu com biometria ligada volta ao login mantendo a sessão: nessa
// volta a tela de biometria não pede a digital sozinha (a pessoa toca para
// entrar). Estado de módulo — vale para a navegação client-side seguinte.
let skipBiometricAutoPrompt = false;

export function skipBiometricAutoPromptOnce() {
  skipBiometricAutoPrompt = true;
}

export function biometricAutoPromptSkipped() {
  return skipBiometricAutoPrompt;
}

export function clearBiometricAutoPromptSkip() {
  skipBiometricAutoPrompt = false;
}

export async function hasSavedProtectedSession(): Promise<boolean> {
  const session = getSession();
  if (!session?.accessToken?.trim()) {
    return false;
  }

  const mode = await resolveProtectedAccessMode();
  return mode === "web-session" || mode === "biometric";
}

// Sessão liberada nesta execução do app: a sessão restaurada do storage não abre o
// portal sozinha; precisa da biometria (ou do login com senha, quando não há
// biometria) a cada abertura (docs/autenticacao-e-permissoes.md → "Biometria").
// Estado de módulo: some ao fechar o app e ao recarregar o pacote.
let sessionUnlocked = false;

export function markSessionUnlocked() {
  sessionUnlocked = true;
}

export function lockSession() {
  sessionUnlocked = false;
}

export function isSessionUnlocked() {
  return sessionUnlocked;
}

// A consulta da atualização remota no início foi recusada por autenticação: depois
// da biometria, a sessão é renovada e o início consulta de novo.
let renewAfterUnlock = false;

export function requestRenewalAfterUnlock() {
  renewAfterUnlock = true;
}

export function takeRenewalAfterUnlock() {
  const pending = renewAfterUnlock;
  renewAfterUnlock = false;
  return pending;
}
