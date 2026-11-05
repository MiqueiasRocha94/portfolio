/**
 * Registro de marcas (whitelabel).
 *
 * Assets vivem em `public/brands/<id>/` (login hero, logo, favicon) e são
 * servidos por caminho absoluto. A base traz só a marca neutra `base`; cada
 * produto registra as suas aqui (id em `BrandId`, perfil em `BRANDS`, dados
 * institucionais em `config/brand-info`).
 *
 * A marca ativa vem de `NEXT_PUBLIC_BRAND` em tempo de BUILD (inlined pelo Next),
 * setada pelo build-arg `BRAND` do Docker. Sem a env — ou com valor inválido —
 * cai no default `base`. Ver docs/tema-marca-e-idioma.md → "Marca".
 */

import type { BrandThemeContract, ColorScheme } from "@/lib/theme/color-scheme";

export type BrandId = "base" | "miqueias";

/** Tríade de marcas do esquema de cores (mesma do color-scheme: light). */
export type BrandColors = {
  primary: string;
  secondary: string;
  tertiary: string;
};

export type BrandProfile = {
  id: BrandId;
  name: string;
  /** Cores padrão do white-label. O switcher aplica estas cores ao esquema ativo. */
  colors: BrandColors;
  /** Fundo em tela cheia do login (view desktop). */
  loginImage: string;
  /** Fundo do login na view mobile (sem ele, vale `loginImage`). */
  loginImageMobile?: string;
  /** Logo da marca (topo do login no mobile/<720). */
  logo: string;
  /** Favicon da marca (opcional). */
  favicon?: string;
};

export const BRANDS: Record<BrandId, BrandProfile> = {
  base: {
    id: "base",
    name: "Base",
    colors: { primary: "#2563eb", secondary: "#3e8744", tertiary: "#f5b400" },
    loginImage: "/brands/base/login.svg",
    logo: "/brands/base/logo.svg",
    favicon: "/brands/base/favicon.svg",
  },
  miqueias: {
    id: "miqueias",
    name: "Miqueias Rocha",
    colors: { primary: "#ee4444", secondary: "#3b82f6", tertiary: "#f5b400" },
    loginImage: "/brands/miqueias/login.png",
    loginImageMobile: "/brands/miqueias/login-mobile.png",
    logo: "/brands/miqueias/logo.svg",
    favicon: "/brands/miqueias/favicon.png",
  },
};

/** Ordem canônica das marcas (para listagens, ex.: switcher de dev). */
export const BRAND_IDS: BrandId[] = ["miqueias", "base"];

/**
 * Default da WL publicado como `ColorScheme` que o Theme sabe aplicar. O objeto
 * PERTENCE ao domínio da Brand: id `brand:<id>` e `builtin` (o Theme nunca o
 * edita nem persiste). É o único formato de cor que a Brand expõe ao Theme —
 * o `colors` da marca permanece detalhe interno.
 */
export function brandDefaultScheme(profile: BrandProfile): ColorScheme {
  return {
    id: `brand:${profile.id}`,
    name: profile.name,
    builtin: true,
    light: profile.colors,
  };
}

/**
 * Contrato PÚBLICO Brand -> Theme para uma marca. Único canal de comunicação:
 * o Theme lê isto, nunca `brand.colors`/estado interno da Brand.
 */
export function brandThemeContract(profile: BrandProfile): BrandThemeContract {
  return {
    brandId: profile.id,
    defaultScheme: brandDefaultScheme(profile),
  };
}

/** Default quando `NEXT_PUBLIC_BRAND` não está setada (ex.: dev, homolog). */
const DEFAULT_BRAND_ID: BrandId = "miqueias";

/** Marca ativa do build, vinda de `NEXT_PUBLIC_BRAND` (inlined) — ver doc no topo. */
function resolveActiveBrandId(): BrandId {
  const fromEnv = process.env.NEXT_PUBLIC_BRAND?.trim().toLowerCase();
  return fromEnv && fromEnv in BRANDS ? (fromEnv as BrandId) : DEFAULT_BRAND_ID;
}

export const ACTIVE_BRAND_ID: BrandId = resolveActiveBrandId();

export const activeBrand: BrandProfile = BRANDS[ACTIVE_BRAND_ID];

