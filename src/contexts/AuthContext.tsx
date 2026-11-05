"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  clearSession,
  getBiometricPreference,
  getSession,
  getSessionUser,
  saveSession,
  sessaoRenovavel,
  setBiometricPreference,
  subscribeSession,
  type AuthSession,
} from "@/lib/auth/session";
import {
  hasSavedProtectedSession,
  resolveProtectedAccessMode,
  skipBiometricAutoPromptOnce,
  type ProtectedAccessMode,
} from "@/lib/auth/protected-access";
import { HttpError } from "@/lib/http";
import { getLoginDeviceId } from "@/lib/platform/device-info";
import * as acesso from "@/services/acesso";
import type { SessaoAcesso } from "@/types/acesso";
import type { Permission, Role, User } from "@/types/user";

type AuthContextValue = {
  isReady: boolean;
  session: AuthSession | null;
  /** Identidade autenticada completa — fonte de verdade da autorizacao na UI. */
  user: User | null;
  /** Atalhos derivados de `user.authorization` (vazios quando deslogado). */
  roles: Role[];
  permissions: Permission[];
  biometricEnabled: boolean;
  setBiometricEnabled: (enabled: boolean) => void;
  /**
   * `POST /auth/login`. `captcha` = token do Turnstile (web). Rejeita com
   * `HttpError` (mostrar `message`).
   */
  signIn: (login: string, senha: string, biometricOptIn?: boolean, captcha?: string) => Promise<void>;
  /** Encerra a sessão de fato (servidor + aparelho). */
  signOut: () => void;
  /**
   * "Sair" do menu da conta: com biometria ligada no app, volta ao login MANTENDO
   * a sessão (a biometria a reabre; "Sair" no login encerra de fato); sem ela, `signOut`.
   */
  leaveSession: () => Promise<void>;
  refreshSession: () => Promise<AuthSession | null>;
  resolveAccessMode: () => Promise<ProtectedAccessMode>;
  hasProtectedSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Renova o token este tanto antes de vencer (access token de 15 min). */
const RENOVAR_ANTES_MS = 60_000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const apply = useCallback((next: AuthSession | null) => {
    setSession(next);
    setUser(next ? getSessionUser() : null);
    setBiometricEnabledState(next ? getBiometricPreference(next.login) : false);
    setIsReady(true);
  }, []);

  const signOut = useCallback(() => {
    // Revoga a sessao no servidor sem esperar: o logout local nao depende da rede.
    const atual = getSession();
    if (atual) {
      void acesso.sair(atual.accessToken).catch(() => undefined);
    }
    clearSession();
    apply(null);
  }, [apply]);

  const leaveSession = useCallback(async () => {
    if ((await resolveProtectedAccessMode()) === "biometric") {
      skipBiometricAutoPromptOnce();
      return;
    }
    signOut();
  }, [signOut]);

  // Mudancas feitas fora daqui: token renovado pelo transporte, refresh recusado.
  useEffect(() => subscribeSession(apply), [apply]);

  // Renovacao proativa: pouco antes de o access token vencer. Falha de rede e
  // ignorada — a proxima chamada com 401 renova de novo (transporte).
  useEffect(() => {
    if (!session || !sessaoRenovavel(session)) {
      return;
    }
    const espera = Math.max(0, session.expiresAt - Date.now() - RENOVAR_ANTES_MS);
    const timer = window.setTimeout(() => {
      void acesso.renovar().catch(() => undefined);
    }, espera);
    return () => window.clearTimeout(timer);
  }, [session]);

  /** Guarda a resposta do auth (substitui o token). */
  const accept = useCallback((sessao: SessaoAcesso, current: AuthSession | null) => {
    apply(saveSession(sessao, current));
  }, [apply]);

  // Abertura do app com token salvo: a sessao revalida em `/me`
  // (200 segue, 401 login).
  const refreshSession = useCallback(async () => {
    const stored = getSession();
    apply(stored);
    if (!stored) {
      return stored;
    }

    try {
      const sessao = await acesso.me(stored.accessToken);
      // `/me` pode ter renovado o token no caminho: parte da sessao atual.
      const next = saveSession(sessao, getSession() ?? stored);
      apply(next);
      return next;
    } catch (error) {
      if (error instanceof HttpError && error.status === 401) {
        signOut();
        return null;
      }
      // Rede/5xx: mantem a sessao local; as chamadas seguintes decidem.
      return stored;
    }
  }, [apply, signOut]);

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      await refreshSession();
    })();
  }, [refreshSession]);

  const signIn = useCallback(async (login: string, senha: string, biometricOptIn = false, captcha?: string) => {
    // "Outro usuario" com acesso salvo: a sessao anterior so cai depois do login
    // novo dar certo (falhou, o acesso salvo continua valendo).
    const anterior = getSession();
    const sessao = await acesso.login(login.trim(), senha, await getLoginDeviceId(), captcha);
    if (anterior) {
      void acesso.sair(anterior.accessToken).catch(() => undefined);
    }
    setBiometricPreference(sessao.login, biometricOptIn);
    accept(sessao, null);
  }, [accept]);

  const handleSetBiometricEnabled = useCallback((enabled: boolean) => {
    if (!session) {
      return;
    }

    setBiometricPreference(session.login, enabled);
    setBiometricEnabledState(enabled);
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      session,
      user,
      roles: user?.authorization.roles ?? [],
      permissions: user?.authorization.permissions ?? [],
      biometricEnabled,
      setBiometricEnabled: handleSetBiometricEnabled,
      signIn,
      signOut,
      leaveSession,
      refreshSession,
      resolveAccessMode: resolveProtectedAccessMode,
      hasProtectedSession: hasSavedProtectedSession,
    }),
    [
      biometricEnabled,
      handleSetBiometricEnabled,
      isReady,
      leaveSession,
      refreshSession,
      session,
      signIn,
      signOut,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
