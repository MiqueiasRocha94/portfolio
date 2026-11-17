import { z } from "zod";

/**
 * Documento do currículo (docs/specs/curriculo.md → "Contrato da API"). Um
 * documento só; as versões (pessoal, empresa, pública) saem dele pela projeção
 * de `lib/resume/projection.ts`. Validado na rota de servidor e na tela.
 */

/**
 * Em que versões o trecho entra: `all` (todas), `standard` (pessoal e pública:
 * redação trocada na versão empresa), `private` (pessoal e empresa: fora da
 * pública) e `company` (só a versão empresa).
 */
export const resumeAudienceSchema = z.enum(["all", "standard", "private", "company"]);

const text = z.string().max(2000);
const short = z.string().max(200);

/** Linha de texto com público; `label` é o prefixo em negrito ("ConsigPlus:"). */
export const resumeLineSchema = z.object({
  label: short.optional(),
  text,
  audience: resumeAudienceSchema,
});

const lines = z.array(resumeLineSchema).max(60);
const id = z.string().min(1).max(60);

export const resumeSchema = z.object({
  profile: z.object({
    name: short.trim().min(1),
    roles: z.array(short).max(4),
    location: short,
    photo: short,
    links: z.array(z.object({ key: short, text: short, url: z.string().url().max(300) })).max(8),
    /** Privado: só nas versões pessoal e empresa; a versão pública sai sem ele. */
    contact: z.object({ email: short, phone: short }).optional(),
  }),
  summary: lines,
  stack: lines,
  focus: lines,
  highlights: lines,
  skills: z.array(z.object({ id, title: short, items: lines, audience: resumeAudienceSchema })).max(20),
  experience: z
    .array(
      z.object({
        id,
        role: short,
        company: short,
        period: short,
        current: z.boolean(),
        meta: lines,
        description: text,
        highlights: lines,
        audience: resumeAudienceSchema,
      }),
    )
    .max(20),
  education: z
    .array(z.object({ id, course: short, institution: short, status: short, description: text, audience: resumeAudienceSchema }))
    .max(10),
  languages: z.array(z.object({ id, code: short, level: short, audience: resumeAudienceSchema })).max(10),
  projects: z
    .array(z.object({ id, name: short, url: short, description: text, tags: lines, audience: resumeAudienceSchema }))
    .max(20),
});

export type ResumeAudience = z.infer<typeof resumeAudienceSchema>;
export type ResumeLine = z.infer<typeof resumeLineSchema>;
export type Resume = z.infer<typeof resumeSchema>;
export type ResumeSkillGroup = Resume["skills"][number];
export type ResumeExperience = Resume["experience"][number];
export type ResumeEducation = Resume["education"][number];
export type ResumeLanguage = Resume["languages"][number];
export type ResumeProject = Resume["projects"][number];

/** Versão gerada do documento. */
export type ResumeVariant = "personal" | "company" | "public";
