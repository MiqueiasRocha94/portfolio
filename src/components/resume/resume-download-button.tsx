"use client";

import { useEffect, useState } from "react";
import { Download, LoaderCircle } from "lucide-react";

import { downloadResumePdf } from "@/components/resume/resume-pdf";
import type { Resume } from "@/lib/resume/resume.schema";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { getPublicResume } from "@/services/resume";

/**
 * "Baixar currículo" do portfólio (docs/specs/curriculo.md → "Telas e estados"):
 * busca a versão pública (`GET /resume`) ao montar; sem ela (falha, 404, espelho
 * público sem rotas de servidor) o botão não aparece. Ao tocar, gera e entrega o PDF.
 */
export function ResumeDownloadButton({ label, errorLabel, className }: { label: string; errorLabel: string; className?: string }) {
  const [resume, setResume] = useState<Resume | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let active = true;
    getPublicResume()
      .then((loaded) => {
        if (active) setResume(loaded);
      })
      .catch((error: unknown) => console.warn("[resume] /resume indisponível; botão oculto:", error));
    return () => {
      active = false;
    };
  }, []);

  if (!resume) return null;

  const download = async () => {
    setGenerating(true);
    try {
      await downloadResumePdf(resume, "public", "");
    } catch (error) {
      console.error("[resume] falha ao gerar o PDF:", error);
      toast.error(errorLabel);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button type="button" disabled={generating} aria-busy={generating} onClick={() => void download()} className={cn("inline-flex items-center gap-2", className)}>
      {generating ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />}
      {label}
    </button>
  );
}
