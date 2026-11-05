/** Contrato da API do assistente (Uriel) — docs/integracoes.md → "API do assistente (chat)". */

/** Quem pergunta: muda o tom e o limite do histórico. */
export type ChatAudience = "admin" | "visitante";

export type ChatReply = { message?: string };

export type ChatMessage = {
  id: string;
  text: string;
  fromUser: boolean;
  time: string;
};

/** Contexto (instruções base) do agente. */
export type AiContext = {
  id?: number;
  name: string;
  context: string;
  ativo: boolean;
};

/** Script (prompt) do agente, por modelo. */
export type AiPrompt = {
  id?: number;
  command: string;
  model: string;
  ativo: boolean;
};
