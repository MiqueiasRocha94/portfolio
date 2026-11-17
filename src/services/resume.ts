import { apiFetch } from "@/lib/http";
import type { Resume } from "@/lib/resume/resume.schema";
import { chamarApi } from "@/services/api/cliente";
import { getJson } from "@/services/api/recursos";

/**
 * Service do currículo (docs/specs/curriculo.md → "Contrato da API"). O
 * documento completo vem de `/private/resume`, sob a raiz de acesso e com o token
 * da sessão; a versão pública, de `GET /resume`, na própria origem (só a web tem
 * o botão). Erros chegam como `HttpError`; a decisão fica na tela.
 */

const PRIVATE = "/private/resume";

export function getResume(token: string): Promise<Resume> {
  return getJson(PRIVATE, token);
}

export async function saveResume(token: string, resume: Resume): Promise<Resume> {
  const response = await chamarApi(PRIVATE, { token, method: "PUT", body: JSON.stringify(resume) });
  return (await response.json()) as Resume;
}

export async function getPublicResume(): Promise<Resume> {
  const response = await apiFetch("/resume", { baseUrl: "", cache: "no-store" });
  return (await response.json()) as Resume;
}
