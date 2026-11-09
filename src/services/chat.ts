import { runtimeUrl } from "@/lib/env/runtime-config";
import { apiFetch } from "@/lib/http";
import { isNativePlatform } from "@/lib/platform/capacitor";
import type { AiContext, AiPrompt, ChatAudience, ChatReply } from "@/types/chat";

/**
 * Service da API do assistente (Uriel) — docs/integracoes.md → "API do assistente (chat)".
 *
 * A raiz (`baseUrl`) vem do `ChatContext`: no portfólio, a de `GET /config/chat`
 * (`loadPublicChatUrl`); no portal, a que o layout do portal entrega ao contexto.
 * Raiz vazia = chat desligado.
 * Erros chegam como `HttpError`; a decisão do que mostrar fica na tela.
 */

export const trimChatUrl = (url: string) => url.trim().replace(/\/+$/, "");

/**
 * Raiz do chat público: `GET /config/chat` (`CHAT_URL` do servidor). Na web, na própria origem; no app, que
 * não tem servidor, na raiz de acesso (`acessoApiUrl`, a origem do site). Sem valor ou com falha, `""`.
 */
export async function loadPublicChatUrl(): Promise<string> {
  try {
    const response = await apiFetch("/config/chat", {
      baseUrl: isNativePlatform() ? runtimeUrl("acessoApiUrl") : "",
      cache: "no-store",
    });
    const config = (await response.json()) as { chatUrl?: unknown };
    return typeof config.chatUrl === "string" ? trimChatUrl(config.chatUrl) : "";
  } catch (error) {
    console.warn("[chat] /config/chat indisponível; chat desligado:", error);
    return "";
  }
}

async function getJson<T>(baseUrl: string, path: string): Promise<T> {
  const response = await apiFetch(path, { baseUrl, cache: "no-store" });
  return (await response.json()) as T;
}

async function postJson<T>(baseUrl: string, path: string, body: unknown): Promise<T> {
  const response = await apiFetch(path, { baseUrl, method: "POST", body: JSON.stringify(body) });
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** `GET /actuator/health` — o assistente está no ar? */
export async function isChatOnline(baseUrl: string): Promise<boolean> {
  const health = await getJson<{ status?: string }>(baseUrl, "/actuator/health");
  return health.status === "UP";
}

/** `POST /api/v1/chat` — pergunta ao assistente com o histórico das respostas anteriores. */
export async function askChat(
  baseUrl: string,
  question: string,
  previousResponse: string,
  audience: ChatAudience,
): Promise<string> {
  const reply = await postJson<ChatReply>(baseUrl, "/api/v1/chat", {
    id: 0,
    ativo: true,
    name: "Uriel",
    birthDate: "2026-03-06",
    address: "",
    question,
    previousResponse,
    usertypes: audience,
    idSystem: 1,
  });
  return reply?.message ?? "";
}

/** `GET /api/v1/model` — modelos disponíveis no assistente. */
export function listChatModels(baseUrl: string): Promise<{ name: string }[]> {
  return getJson(baseUrl, "/api/v1/model");
}

/** `GET /api/v1/admin/list/aicontext/AgentAI` — contexto do agente. */
export function getAiContext(baseUrl: string): Promise<AiContext> {
  return getJson(baseUrl, "/api/v1/admin/list/aicontext/AgentAI");
}

/** `POST /api/v1/admin/aicontext` — cria ou atualiza o contexto. */
export function saveAiContext(baseUrl: string, context: AiContext): Promise<void> {
  return postJson(baseUrl, "/api/v1/admin/aicontext", context);
}

/** `GET /api/v1/admin/list/prompt/AgentAI` — scripts (prompts) do agente. */
export function listAiPrompts(baseUrl: string): Promise<AiPrompt[]> {
  return getJson(baseUrl, "/api/v1/admin/list/prompt/AgentAI");
}

/** `POST /api/v1/admin/prompt` — cria ou atualiza um script. */
export function saveAiPrompt(baseUrl: string, prompt: AiPrompt): Promise<void> {
  return postJson(baseUrl, "/api/v1/admin/prompt", prompt);
}
