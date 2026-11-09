import type { BrandId } from "@/config/brand";
import type { BrandInfo } from "@/types/brand";

/**
 * Dados institucionais por marca (white-label). Mesmos em dev e
 * produção enquanto a API não trouxer por WL. Os da marca `base` são
 * placeholders: cada produto substitui pelos seus. Ver `services/brand`.
 */
const BRAND_INFO: Record<BrandId, BrandInfo> = {
  base: {
    id: "base",
    domain: "example.com",
    name: "Base",
    company: "Empresa Exemplo",
    article: "A",
    legalName: "EMPRESA EXEMPLO LTDA",
    cnpj: "",
    phone: "",
    email: "",
    address: "",
    termsFile: "",
    stores: { playStore: false, appStore: false },
    chatbot: false,
  },
  miqueias: {
    id: "miqueias",
    domain: "miqueias-rocha.dev",
    name: "Miqueias Rocha",
    company: "Miqueias Rocha",
    article: "O",
    legalName: "",
    cnpj: "",
    phone: "",
    email: "",
    address: "",
    termsFile: "",
    stores: { playStore: false, appStore: false },
    chatbot: true,
  },
};

/** Informações institucionais de um WL. */
export function brandInfo(id: BrandId): BrandInfo {
  return BRAND_INFO[id];
}
