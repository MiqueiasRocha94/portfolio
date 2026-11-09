/**
 * `GET /config/chat` — raiz pública da API do assistente para o portfólio
 * (docs/integracoes.md → "API do assistente (chat)"). Lê só `CHAT_URL` do
 * ambiente do servidor a cada requisição (Worker ou contêiner): trocar o valor
 * não exige build. Sem valor, `chatUrl: ""` (chat indisponível).
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { chatUrl: process.env.CHAT_URL?.trim() ?? "" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
