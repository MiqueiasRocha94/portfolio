"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { ACTIVE_BRAND_ID, BRANDS, brandThemeContract, type BrandId, type BrandProfile } from "@/config/brand";
import { getBrandInfo } from "@/services/brand";
import type { BrandInfo } from "@/types/brand";
import type { BrandThemeContract } from "@/lib/theme/color-scheme";

/**
 * Marca ativa (whitelabel). É a ENTRADA da identidade do produto:
 * - `brand` (id/nome/cores/assets) — consumido por telas e pelo ThemeProvider
 *   (que é a fonte única das cores: ele lê `useBrand()`, não o contrário).
 * - Identidade do documento (title + favicon) em runtime, complementando o
 *   metadata do build.
 *
 * Valor padrão = `ACTIVE_BRAND_ID` (fixado no build).
 */

type BrandContextValue = {
  brandId: BrandId;
  brand: BrandProfile;
  /**
   * Informações institucionais do WL (razão social, CNPJ, contato, termos…),
   * recuperadas do backend por marca. `null` enquanto carrega ou se falhar — os
   * consumidores devem cair no `brand` síncrono. Ver `services/brand`.
   */
  info: BrandInfo | null;
  /**
   * Contrato PÚBLICO consumido pelo ThemeContext: id da marca + default da WL
   * (encapsulado). É o único canal Brand -> Theme; o Theme não lê `brand.colors`.
   */
  themeContract: BrandThemeContract;
};

const BrandContext = createContext<BrandContextValue | null>(null);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  // Inicia determinístico (bate com o SSR); o override de dev entra após montar.
  const [brandId, setBrandId] = useState<BrandId>(ACTIVE_BRAND_ID);
  // Informações do WL: carregadas do backend (mock) por marca, após montar.
  const [info, setInfo] = useState<BrandInfo | null>(null);


  // Identidade do documento (title + favicon) segue a marca em runtime,
  // complementando o metadata do build (que cobre o SSR/produção). Mantém title
  // e favicon SEMPRE juntos — evita a inconsistência de um mudar e o outro não.
  // Marca sem favicon mantém o ícone que estiver no <head>.
  useEffect(() => {
    const brand = BRANDS[brandId];

    // Aplica a identidade da marca (título + favicon). O favicon atualiza TODOS os
    // `link[rel=icon]` — inclusive o que o Next renderiza a partir do metadata
    // (`icons: activeBrand.favicon`), evitando que sobrem dois ícones concorrentes.
    const applyIdentity = () => {
      if (document.title !== brand.name) {
        document.title = brand.name;
      }
      const favicon = brand.favicon;
      if (!favicon) {
        return;
      }
      const icons = document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]');
      if (icons.length === 0) {
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = favicon;
        document.head.appendChild(link);
        return;
      }
      icons.forEach((link) => {
        if (link.getAttribute("href") !== favicon) {
          link.setAttribute("href", favicon);
        }
      });
    };

    applyIdentity();

  }, [brandId]);

  // Consumo da API de white-label: recupera as informações da marca ativa.
  // Hoje resolve pelo Dev Backend (mock); vira `apiFetch` quando o backend real
  // existir. Refaz a cada troca de marca (dev switcher) e descarta respostas
  // obsoletas se a marca mudar no meio do caminho.
  useEffect(() => {
    let active = true;
    // setState só nos callbacks async (não no corpo do efeito). `active` descarta
    // a resposta se a marca mudar antes de resolver. Info antiga persiste durante
    // o carregamento (resolução instantânea no mock; consumidores caem no `brand`).
    const loadInfo = () => {
      getBrandInfo(brandId)
        .then((data) => {
          if (active) {
            setInfo(data);
          }
        })
        .catch(() => {
          if (active) {
            setInfo(null);
          }
        });
    };
    loadInfo();
    return () => {
      active = false;
    };
  }, [brandId]);


  const value = useMemo<BrandContextValue>(
    () => ({
      brandId,
      brand: BRANDS[brandId],
      info,
      themeContract: brandThemeContract(BRANDS[brandId]),
    }),
    [brandId, info, ],
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrand must be used within BrandProvider.");
  }
  return context;
}
