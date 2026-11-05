"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { AppDictionary } from "@/lib/i18n/dictionaries";

/**
 * Textos do portfólio (namespace lazy `portfolio`, carregado pela rota). `null`
 * até o carregamento terminar: a tela não renderiza com textos vazios.
 */
export function usePortfolioText(): AppDictionary["portfolio"] | null {
  const { dictionary } = useLanguage();
  return dictionary.portfolio.nav ? dictionary.portfolio : null;
}
