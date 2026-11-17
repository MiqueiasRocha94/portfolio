import { saveFile } from "@/lib/platform/save-file";
import { projectResume } from "@/lib/resume/projection";
import type { Resume, ResumeVariant } from "@/lib/resume/resume.schema";

/**
 * Gera e entrega o PDF de uma versão do currículo (docs/specs/curriculo.md →
 * "Telas e estados"). A biblioteca e o documento são carregados só aqui, ao
 * gerar, para não pesar nas telas.
 */

const SUFFIX: Record<ResumeVariant, string> = { personal: "", company: "-Empresa", public: "-Publico" };

/** `Curriculo-<Nome>[-<versão>].pdf`, sem acentos nem espaços. */
export function resumeFileName(name: string, suffix = ""): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `Curriculo-${slug || "Curriculo"}${suffix}.pdf`;
}

/** Foto como data URL; sem foto ou com falha, o PDF sai sem ela. */
async function loadPhoto(path: string): Promise<string | null> {
  if (!path) return null;
  try {
    const response = await fetch(new URL(path, window.location.origin));
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler a foto."));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("[resume] foto indisponível; PDF sem foto:", error);
    return null;
  }
}

/** Projeta `resume` na versão e gera o PDF (o mesmo arquivo do download e da visualização). */
export async function renderResumePdf(resume: Resume, variant: ResumeVariant): Promise<Blob> {
  const projected = projectResume(resume, variant);
  const [{ pdf }, { ResumeDocument }, photoUrl] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/resume/resume-document"),
    loadPhoto(projected.profile.photo),
  ]);
  return pdf(<ResumeDocument resume={projected} photoUrl={photoUrl} />).toBlob();
}

/**
 * Gera o PDF da versão e entrega (`saveFile`). `fileSuffix` troca o sufixo
 * padrão da versão (o portfólio baixa sem sufixo).
 */
export async function downloadResumePdf(resume: Resume, variant: ResumeVariant, fileSuffix?: string): Promise<void> {
  const blob = await renderResumePdf(resume, variant);
  await saveFile(blob, resumeFileName(resume.profile.name, fileSuffix ?? SUFFIX[variant]));
}
