import { clienteApp } from "@/lib/auth/canal";
import { obterJktDpop } from "@/lib/auth/dpop";
import type { AuthSession } from "@/lib/auth/session";
import { obterAtestadoApp } from "@/lib/platform/app-attestation";
import { acessoApiUrl, chamarApi, renovarSessao } from "@/services/api/cliente";
import type { SessaoAcesso } from "@/types/acesso";

/**
 * Service de ACESSO — auth da API (docs/autenticacao-e-permissoes.md).
 *
 * Com `acessoApiUrl()` definido fala com a API (`chamarApi`); sem ele usa o
 * dev-backend, que reproduz o mesmo contrato. As telas nao sabem a origem.
 * Canal, captcha, DPoP e refresh seguem docs/autenticacao-e-permissoes.md "Canais".
 *
 * Erros chegam como `HttpError` (`status` = `codigo`, `message` = `message` da
 * API). A decisao do que fazer (401 → login, 403 → mensagem...) fica no chamador.
 */

export { acessoApiUrl };

const usaApi = () => Boolean(acessoApiUrl());

async function chamar(caminho: string, init: RequestInit = {}, token?: string): Promise<SessaoAcesso> {
  const response = await chamarApi(caminho, { ...init, token });
  return (await response.json()) as SessaoAcesso;
}

const post = (corpo?: unknown): RequestInit => ({
  method: "POST",
  body: corpo === undefined ? undefined : JSON.stringify(corpo),
});

/**
 * Campos de canal do login: `clientId` (obrigatorio), `captcha` (web) e o
 * atestado do app (nativo; hoje `null` — plugin pendente).
 */
async function camposDoCanal(captcha?: string) {
  const atestado = await obterAtestadoApp(await obterJktDpop());
  return { clientId: clienteApp(), captcha, atestado: atestado ?? undefined };
}

/**
 * `POST /auth/login`. Senha em texto (HTTPS); nunca reenviar automaticamente.
 * `captcha` = token do Turnstile (web, uso unico — o form gera outro a cada envio).
 */
export async function login(usuario: string, senha: string, deviceid: string, captcha?: string): Promise<SessaoAcesso> {
  return chamar("/auth/login", post({ login: usuario, senha, deviceid, ...(await camposDoCanal(captcha)) }));
}

/** `GET /auth/me` — recarrega a sessao ao abrir o app (sem `token` na resposta). */
export function me(token: string): Promise<SessaoAcesso> {
  return chamar("/auth/me", {}, token);
}

/**
 * `POST /auth/refresh` — token novo antes de o atual vencer.
 * Sem API ou sem refresh valido → `null`.
 */
export function renovar(): Promise<AuthSession | null> {
  return renovarSessao();
}

/**
 * `POST /auth/logout` — revoga a sessao no servidor (token e refresh param
 * na hora; no web apaga o cookie). Aceita token expirado.
 */
export async function sair(token: string): Promise<void> {
  await chamarApi("/auth/logout", { method: "POST", token, renovar: false });
}
