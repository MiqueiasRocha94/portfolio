import type { Resume, ResumeAudience, ResumeLine, ResumeVariant } from "@/lib/resume/resume.schema";

/**
 * Projeção do currículo por versão (docs/specs/curriculo.md → "Contrato da
 * API"). Pura e sem dependências: roda na rota de servidor (versão pública,
 * cortada antes de responder) e na tela (pessoal e empresa).
 */

const INCLUDED: Record<ResumeVariant, ReadonlySet<ResumeAudience>> = {
  personal: new Set(["all", "standard", "private"]),
  company: new Set(["all", "private", "company"]),
  public: new Set(["all", "standard"]),
};

/** Versões que levam o contato (e-mail e telefone). */
const WITH_CONTACT: ReadonlySet<ResumeVariant> = new Set(["personal", "company"]);

export function projectResume(resume: Resume, variant: ResumeVariant): Resume {
  const audiences = INCLUDED[variant];
  const keep = <T extends { audience: ResumeAudience }>(items: T[]) => items.filter((item) => audiences.has(item.audience));
  const keepLines = (items: ResumeLine[]) => keep(items);

  const { contact, ...profile } = resume.profile;
  return {
    profile: WITH_CONTACT.has(variant) && contact ? { ...profile, contact } : profile,
    summary: keepLines(resume.summary),
    stack: keepLines(resume.stack),
    focus: keepLines(resume.focus),
    highlights: keepLines(resume.highlights),
    skills: keep(resume.skills).map((group) => ({ ...group, items: keepLines(group.items) })),
    experience: keep(resume.experience).map((job) => ({
      ...job,
      meta: keepLines(job.meta),
      highlights: keepLines(job.highlights),
    })),
    education: keep(resume.education),
    languages: keep(resume.languages),
    projects: keep(resume.projects).map((project) => ({ ...project, tags: keepLines(project.tags) })),
  };
}
