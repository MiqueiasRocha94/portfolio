"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Bar } from "@/components/ui/bar";
import { TARGET_PATH } from "@/config/routes";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { markLoginEntry } from "@/lib/auth/login-entry";
import { isSessionUnlocked, requestRenewalAfterUnlock } from "@/lib/auth/protected-access";

/**
 * Abertura do app (rota `/` no build mobile; na web `/` é a home do portfólio): só
 * a logo da marca, centralizada, enquanto a sessão salva é revalidada e, com
 * sessão, o canal de atualização é consultado com o token (pacote novo é baixado
 * e aplicado aqui, com barra de progresso). Depois: sem sessão → login; sessão
 * não liberada nesta execução → login (biometria ou formulário); liberada →
 * portal. Canal recusando o token → a biometria renova a sessão e a abertura
 * roda de novo (docs/specs/portal-privado.md → "App (APK)").
 */
export function AppStart() {
  const router = useRouter();
  const { brand } = useBrand();
  const { isVerified, session } = useAuth();
  // Andamento do download do pacote novo (0–100); `null` = sem download.
  const [progress, setProgress] = useState<number | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!isVerified || started.current) {
      return;
    }
    started.current = true;

    void (async () => {
      await Promise.resolve();

      // Sem sessão não há consulta ao canal (exige autenticação).
      if (!session) {
        markLoginEntry();
        router.replace("/login");
        return;
      }


      if (isSessionUnlocked()) {
        router.replace(TARGET_PATH);
        return;
      }
      markLoginEntry();
      router.replace("/login");
    })();
  }, [isVerified, router, session]);

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-8">
      <div className="grid w-full max-w-xs justify-items-center gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brand.logo} alt={brand.name} className="h-16 w-auto max-w-full object-contain" />
        {progress !== null ? (
          <Bar
            value={progress}
          />
        ) : null}
      </div>
    </main>
  );
}
