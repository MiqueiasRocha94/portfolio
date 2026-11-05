/**
 * Conteúdo estático do portfólio que não é texto traduzido (links, números,
 * cores) — os textos ficam em `public/locales/<idioma>/portfolio.json`.
 */

export const SOCIAL_LINKS = {
  github: "https://github.com/MiqueiasRocha94",
  linkedin: "https://www.linkedin.com/in/miqueias-m-rocha/",
} as const;

/** Chave do logo da tecnologia; o componente da seção resolve o ícone. */
export type TechnologyIcon =
  | "spring"
  | "rails"
  | "python"
  | "nextjs"
  | "angular"
  | "php"
  | "primefaces"
  | "jenkins"
  | "docker";

export type Technology = { name: string; icon: TechnologyIcon; color: string };

export const TECHNOLOGIES: Technology[] = [
  { name: "Java Spring", icon: "spring", color: "#6DB33F" },
  { name: "Ruby on Rails", icon: "rails", color: "#CC0000" },
  { name: "Python", icon: "python", color: "#3776AB" },
  { name: "Next.js", icon: "nextjs", color: "#000000" },
  { name: "Angular", icon: "angular", color: "#DD0031" },
  { name: "PHP", icon: "php", color: "#777BB4" },
  { name: "PrimeFaces", icon: "primefaces", color: "#0C7FB0" },
  { name: "Jenkins", icon: "jenkins", color: "#D33833" },
  { name: "Docker", icon: "docker", color: "#2496ED" },
];

/** Valores dos cartões de estatística, na ordem dos rótulos de `gitStats.<fonte>.items`. */
export const GIT_STATS = {
  github: ["50+", "120+", "350+"],
  gitlab: ["25+", "180+", "90+"],
} as const;

export type GitStatsSource = keyof typeof GIT_STATS;

/** Ordem das experiências em `timeline` (a primeira é a atual). */
export const TIMELINE_KEYS = ["brtec", "itau", "plansul", "comercio", "assprom"] as const;
