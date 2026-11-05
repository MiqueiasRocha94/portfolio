import { apiFetch } from "@/lib/http";
import type { AiContext, AiPrompt, ChatAudience, ChatReply } from "@/types/chat";

/**
 * Service da API do assistente (Uriel) — docs/integracoes.md → "API do assistente (chat)".
 *
 * A raiz vem de `/api/config` (D1 no Cloudflare) e cai para `NEXT_PUBLIC_CHATURL`
 * quando a rota não responde (ex.: app mobile, que não tem rotas de servidor).
 * Erros chegam como `HttpError`; a decisão do que mostrar fica na tela.
 */

let chatUrlPromise: Promise<string> | null = null;

async function loadChatUrl(): Promise<string> {
  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as { chatUrl?: string };
      if (data.chatUrl) return data.chatUrl;
    }
  } catch {
    // Sem rota de configuração (export estático): vale a variável do build.
  }
  return process.env.NEXT_PUBLIC_CHATURL ?? "";
}

async function chatUrl(): Promise<string> {
  chatUrlPromise ??= loadChatUrl();
  const url = await chatUrlPromise;
  if (!url) {
    chatUrlPromise = null;
    throw new Error("Endereço da API do assistente não configurado.");
  }
  return url.replace(/\/+$/, "");
}

async function getJson<T>(path: string): Promise<T> {
  const response = await apiFetch(path, { baseUrl: await chatUrl(), cache: "no-store" });
  return (await response.json()) as T;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await apiFetch(path, { baseUrl: await chatUrl(), method: "POST", body: JSON.stringify(body) });
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** `GET /actuator/health` — o assistente está no ar? */
export async function isChatOnline(): Promise<boolean> {
  const health = await getJson<{ status?: string }>("/actuator/health");
  return health.status === "UP";
}

/** `POST /api/v1/chat` — pergunta ao assistente com o histórico das respostas anteriores. */
export async function askChat(question: string, previousResponse: string, audience: ChatAudience): Promise<string> {
  const reply = await postJson<ChatReply>("/api/v1/chat", {
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
export function listChatModels(): Promise<{ name: string }[]> {
  return getJson("/api/v1/model");
}

/** `GET /api/v1/admin/list/aicontext/AgentAI` — contexto do agente. */
export function getAiContext(): Promise<AiContext> {
  return getJson("/api/v1/admin/list/aicontext/AgentAI");
}

/** `POST /api/v1/admin/aicontext` — cria ou atualiza o contexto. */
export function saveAiContext(context: AiContext): Promise<void> {
  return postJson("/api/v1/admin/aicontext", context);
}

/** `GET /api/v1/admin/list/prompt/AgentAI` — scripts (prompts) do agente. */
export function listAiPrompts(): Promise<AiPrompt[]> {
  return getJson("/api/v1/admin/list/prompt/AgentAI");
}

/** `POST /api/v1/admin/prompt` — cria ou atualiza um script. */
export function saveAiPrompt(prompt: AiPrompt): Promise<void> {
  return postJson("/api/v1/admin/prompt", prompt);
}
