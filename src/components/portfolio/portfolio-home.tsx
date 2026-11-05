"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronUp, Mail } from "lucide-react";

import { GithubIcon, LinkedinIcon } from "@/components/portfolio/brand-icons";
import { DragonCursor } from "@/components/portfolio/dragon-cursor";
import { HomeBottomNav, PUBLIC_BOTTOM_NAV_SPACE, PublicHeader } from "@/components/portfolio/public-header";
import { useDevice } from "@/contexts/DeviceContext";
import { usePortfolioText } from "@/hooks/use-portfolio-text";
import { SOCIAL_LINKS } from "@/lib/portfolio/content";
import { cn } from "@/lib/utils";

const CAROUSEL_INTERVAL_MS = 3500;
/** Duração (ms) do encaixe animado entre a tela inicial e o card. */
const SNAP_DURATION_MS = 900;
/** Depois do encaixe, a rolagem segue travada por este tempo (ms), para absorver a inércia do gesto. */
const SNAP_COOLDOWN_MS = 350;
/** Deslocamento mínimo (px) do dedo para o toque contar como gesto de rolar. */
const TOUCH_THRESHOLD = 12;
/** Espaço embaixo das seções para o footer fixo (e, no mobile, a barra de navegação). */
const FOOTER_SPACE = "pb-32 mobile:pb-[calc(var(--app-safe-bottom,0px)+11rem)]";

/**
 * Título nos dois estados, interpolados pela rolagem (`--p`, de 0 a 1): tamanho,
 * espaçamento e posição, do centro da primeira tela ao canto superior esquerdo.
 */
const TITLE_STYLE = {
  mobile: { size: [1.75, 1.05], tracking: [0.12, 0.13], top: [4.5, 1.55], left: 1 },
  desktop: { size: [3.75, 1.25], tracking: [0.12, 0.13], top: [2.5, 1.85], left: 1.5 },
} as const;

const lerp = ([from, to]: readonly [number, number], unit: string) =>
  `calc(${from}${unit} + (${to - from}${unit}) * var(--p))`;

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

type HomeStage = "top" | "card";

function EnergyLine({ className }: { className: string }) {
  return (
    <div className={`relative mx-auto h-[2px] overflow-hidden bg-gradient-to-r from-transparent via-primary to-transparent ${className}`}>
      {/* Brilho que percorre a linha: tom mais claro da marca, para se destacar dela. */}
      <span className="animate-energy absolute left-[-40%] top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-[color:color-mix(in_srgb,var(--color-primary)_55%,white)] to-transparent" />
    </div>
  );
}

/** Ancestral que rola a página (o MainContent do shell), ou o documento. */
function findScroller(element: HTMLElement): HTMLElement {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") {
      return node;
    }
  }
  return document.scrollingElement as HTMLElement;
}

/** Elemento em que o teclado digita ou aciona com espaço: aí as teclas não rolam a home. */
function isTypingTarget(target: EventTarget | null, key: string): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable || target.closest("input, textarea, select")) {
    return true;
  }
  return key === " " && Boolean(target.closest("button, a"));
}

/**
 * Rolagem da home em duas paradas, a tela inicial e o card: um gesto (roda,
 * toque ou teclado) entre elas vira um encaixe animado, com a rolagem travada
 * até terminar; abaixo do topo do card (card mais alto que a tela, no mobile)
 * a rolagem é a normal. Grava o progresso do título (`--p`, 0 no início e 1 no
 * card) direto no estilo da raiz, sem re-render a cada quadro. Anima também
 * com movimento reduzido: o movimento responde ao gesto do próprio usuário.
 */
function useHomeScroll(
  rootRef: RefObject<HTMLDivElement | null>,
  cardSectionRef: RefObject<HTMLElement | null>,
  ready: boolean,
): { stage: HomeStage; goTo: (stage: HomeStage) => void } {
  const [stage, setStage] = useState<HomeStage>("top");
  const goToRef = useRef<(stage: HomeStage) => void>(() => undefined);

  useEffect(() => {
    const root = rootRef.current;
    const section = cardSectionRef.current;
    if (!ready || !root || !section) {
      return;
    }
    const scroller = findScroller(root);
    const isDocument = scroller === document.scrollingElement;
    const scrollTarget: HTMLElement | Window = isDocument ? window : scroller;
    const cardTop = () =>
      section.getBoundingClientRect().top - (isDocument ? 0 : scroller.getBoundingClientRect().top) + scroller.scrollTop;

    let busyUntil = 0;
    let frame = 0;

    const update = () => {
      const top = cardTop();
      const progress = top > 0 ? Math.min(1, Math.max(0, scroller.scrollTop / top)) : 1;
      root.style.setProperty("--p", String(progress));
      setStage(progress >= 0.5 ? "card" : "top");
    };

    const goTo = (next: HomeStage) => {
      const now = performance.now();
      if (now < busyUntil) {
        return;
      }
      const from = scroller.scrollTop;
      const to = next === "card" ? cardTop() : 0;
      if (Math.abs(to - from) < 1) {
        return;
      }
      busyUntil = now + SNAP_DURATION_MS + SNAP_COOLDOWN_MS;
      const step = (time: number) => {
        const t = Math.min(1, (time - now) / SNAP_DURATION_MS);
        scroller.scrollTo({ top: from + (to - from) * easeInOut(t), behavior: "instant" });
        update();
        if (t < 1) {
          frame = requestAnimationFrame(step);
        }
      };
      frame = requestAnimationFrame(step);
    };
    goToRef.current = goTo;

    /** O gesto nesta direção (1 desce, -1 sobe) é da faixa encaixada, entre a tela inicial e o card? */
    const inSnapZone = (direction: number) => {
      const top = cardTop();
      const y = scroller.scrollTop;
      return y < top - 1 || (y <= top + 1 && direction < 0);
    };

    /** Trata o gesto; devolve `true` quando a rolagem nativa deve ser cancelada. */
    const handle = (direction: number) => {
      if (performance.now() < busyUntil) {
        return true;
      }
      if (!inSnapZone(direction)) {
        return false;
      }
      goTo(direction > 0 ? "card" : "top");
      return true;
    };

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY !== 0 && handle(Math.sign(event.deltaY))) {
        event.preventDefault();
      }
    };

    let touchY: number | null = null;
    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (touchY === null || y === undefined) {
        return;
      }
      const delta = touchY - y;
      const direction = Math.sign(delta);
      const locked = performance.now() < busyUntil;
      if (!locked && (direction === 0 || !inSnapZone(direction))) {
        return;
      }
      if (event.cancelable) {
        event.preventDefault();
      }
      if (!locked && Math.abs(delta) > TOUCH_THRESHOLD) {
        goTo(direction > 0 ? "card" : "top");
        touchY = null;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target, event.key)) {
        return;
      }
      const down = ["ArrowDown", "PageDown"].includes(event.key) || (event.key === " " && !event.shiftKey);
      const up = ["ArrowUp", "PageUp"].includes(event.key) || (event.key === " " && event.shiftKey);
      if ((down || up) && handle(down ? 1 : -1)) {
        event.preventDefault();
      }
    };

    update();
    scrollTarget.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    scroller.addEventListener("wheel", onWheel, { passive: false });
    scroller.addEventListener("touchstart", onTouchStart, { passive: true });
    scroller.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      scrollTarget.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      scroller.removeEventListener("wheel", onWheel);
      scroller.removeEventListener("touchstart", onTouchStart);
      scroller.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [rootRef, cardSectionRef, ready]);

  return { stage, goTo: (next) => goToRef.current(next) };
}

/** Card da apresentação: sobe ao entrar na tela. */
function useReveal(ref: RefObject<HTMLElement | null>, ready: boolean): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!ready || !element) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, ready]);
  return visible;
}

/**
 * Home do portfólio (`/`), também a abertura do app: o login só se abre pelo
 * botão dela. Ao rolar, encaixa no card de apresentação e o título vai para o
 * canto no estilo do logo (docs/specs/portfolio-publico.md).
 */
export function PortfolioHome() {
  const { resolved, view } = useDevice();
  const t = usePortfolioText();
  const highlights = t?.home.highlights ?? [];
  const isMobile = view === "mobile";
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const ready = resolved && Boolean(t);
  const cardRef = useRef<HTMLElement>(null);
  const cardSectionRef = useRef<HTMLElement>(null);
  const cardVisible = useReveal(cardRef, ready);
  const { stage, goTo } = useHomeScroll(rootRef, cardSectionRef, ready);

  useEffect(() => {
    if (!isMobile || highlights.length === 0) {
      return;
    }
    const interval = setInterval(() => setActive((prev) => (prev + 1) % highlights.length), CAROUSEL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isMobile, highlights.length]);

  if (!resolved || !t) {
    return null;
  }

  const current = highlights[active];
  const title = TITLE_STYLE[isMobile ? "mobile" : "desktop"];
  const titleStyle: CSSProperties = {
    top: `calc(var(--app-safe-top, 0px) + ${lerp(title.top, "rem")})`,
    left: `calc((50% * (1 - var(--p))) + ${title.left}rem * var(--p))`,
    transform: "translateX(calc(-50% * (1 - var(--p))))",
    fontSize: lerp(title.size, "rem"),
    letterSpacing: lerp(title.tracking, "em"),
  };

  return (
    <div ref={rootRef} data-dragon-chase className="relative w-full shrink-0 bg-background" style={{ "--p": 0 } as CSSProperties}>
      <div className="fixed inset-0">
        <Image src="/portfolio/home.png" alt="" fill priority className="object-cover object-center mobile:object-[72%_18%]" />
        <div className="absolute inset-0 bg-overlay/55" />
      </div>
      <DragonCursor />

      <h1 className="font-display pointer-events-none fixed z-30 grid whitespace-nowrap font-bold leading-tight" style={titleStyle}>
        <span
          className="col-start-1 row-start-1 justify-self-center bg-gradient-to-b from-on-overlay via-on-overlay to-on-overlay/60 bg-clip-text text-transparent drop-shadow-[0_0_12px_color-mix(in_srgb,var(--color-primary)_70%,transparent)]"
          style={{ opacity: "clamp(0, (0.6 - var(--p)) * 4, 1)" }}
        >
          Miqueias Rocha
        </span>
        <span aria-hidden="true" className="col-start-1 row-start-1 justify-self-center uppercase" style={{ opacity: "clamp(0, (var(--p) - 0.4) * 4, 1)" }}>
          <span className="text-on-overlay">Miqueias</span> <span className="text-primary">Rocha</span>
        </span>
      </h1>

      <PublicHeader />

      <div className="relative z-10 text-on-overlay">

        <section className={cn("flex min-h-[100dvh] flex-col", FOOTER_SPACE)}>
          <div className="pt-[calc(var(--app-safe-top,0px)+4.5rem)] text-center desktop:pt-10">
            {/* Lugar do título na primeira tela (ele é fixo, para deslizar até o canto). */}
            <div aria-hidden="true" className="h-[2.25rem] desktop:h-[4.7rem]" />
            <EnergyLine className="mb-3 mt-4 w-64 desktop:w-80" />
            <p className="font-display text-sm tracking-[0.05em] text-primary desktop:text-lg">{t.home.role}</p>
          </div>

          <div className="flex flex-1 flex-col items-center gap-6 px-5 pt-6 desktop:gap-8 desktop:px-6 desktop:pt-8">
            {isMobile ? (
              current && (
                <div className="w-full">
                  <div
                    key={active}
                    className="rounded-xl border border-primary/30 bg-overlay/60 p-4 backdrop-blur-sm animate-[slideUpFade_0.5s_ease]"
                  >
                    <h2 className="font-display text-sm font-semibold tracking-[0.04em] text-primary">{current.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-on-overlay/75">{current.description}</p>
                  </div>
                  <div className="mt-3 flex justify-center gap-2">
                    {highlights.map((item, index) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => setActive(index)}
                        aria-label={t.home.showHighlight.replace("{{n}}", String(index + 1))}
                        className={`h-1.5 rounded-full transition-all ${index === active ? "w-5 bg-primary" : "w-1.5 bg-primary/30"}`}
                      />
                    ))}
                  </div>
                </div>
              )
            ) : (
              <div className="grid w-full max-w-4xl grid-cols-3 gap-3">
                {highlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-primary/30 bg-overlay/60 p-4 backdrop-blur-sm transition hover:border-primary/70 hover:bg-overlay/75"
                  >
                    <h2 className="font-display text-sm font-semibold tracking-[0.04em] text-primary">{item.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-on-overlay/75">{item.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </section>

        <section
          ref={cardSectionRef}
          className={cn("flex min-h-[100dvh] items-center justify-center px-5 pt-20 desktop:px-6 desktop:pt-24", FOOTER_SPACE)}
        >
          <article
            ref={cardRef}
            data-dragon-orbit
            className={cn(
              "grid w-full max-w-4xl gap-6 rounded-2xl border border-primary/30 bg-overlay/60 p-6 backdrop-blur-md transition duration-700 ease-out desktop:grid-cols-[auto_1fr] desktop:gap-10 desktop:p-10",
              cardVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0",
            )}
          >
            <Image
              src="/portfolio/profile-photo.png"
              alt={t.profile.photoAlt}
              width={480}
              height={640}
              className="mx-auto aspect-[3/4] w-44 rounded-xl border border-primary/40 object-cover object-[center_15%] shadow-[0_0_20px_color-mix(in_srgb,var(--color-primary)_35%,transparent)] desktop:w-60 desktop:self-center"
            />
            <div className="flex flex-col gap-3">
              <p className="font-display text-xs uppercase tracking-[0.16em] text-primary desktop:text-sm">{t.profile.kicker}</p>
              <h2 className="font-display text-xl font-semibold text-on-overlay desktop:text-2xl">{t.home.role}</h2>
              <p className="text-sm leading-relaxed text-on-overlay/80 desktop:text-base">{t.about.paragraph1}</p>
              <p className="text-sm leading-relaxed text-on-overlay/80 desktop:text-base">{t.about.paragraph2}</p>
              <Link
                href="/sobre-mim"
                className="font-display mt-1 self-start rounded-full border border-primary/40 px-4 py-2 text-xs uppercase tracking-[0.16em] text-primary transition hover:border-primary hover:text-primary-strong"
              >
                {t.home.learnMore} →
              </Link>
            </div>
          </article>
        </section>

      </div>

      <footer className={cn("pointer-events-none fixed inset-x-0 bottom-0 z-20 pb-[calc(var(--app-safe-bottom,0px)+1rem)]", PUBLIC_BOTTOM_NAV_SPACE)}>
        <EnergyLine className="mb-4 w-[72vw] desktop:w-[60vw]" />
        <div className="pointer-events-auto mx-auto flex w-fit items-center justify-center gap-8 text-primary desktop:gap-12">
          <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <GithubIcon className="size-6 transition duration-300 hover:scale-110 hover:text-primary desktop:size-8" />
          </a>
          <a href="mailto:" aria-label="E-mail">
            <Mail className="size-6 transition duration-300 hover:scale-110 hover:text-primary desktop:size-8" />
          </a>
          <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <LinkedinIcon className="size-6 transition duration-300 hover:scale-110 hover:text-primary desktop:size-8" />
          </a>
        </div>
        {/* Convite a rolar: para baixo na tela inicial, para cima no card; pisca sempre. */}
        <button
          type="button"
          onClick={() => goTo(stage === "card" ? "top" : "card")}
          aria-label={stage === "card" ? t.home.scrollUp : t.home.scrollDown}
          className="pointer-events-auto mx-auto mt-2 flex animate-pulse text-primary"
        >
          {stage === "card" ? <ChevronUp aria-hidden="true" className="size-7" /> : <ChevronDown aria-hidden="true" className="size-7" />}
        </button>
      </footer>
      <HomeBottomNav />
    </div>
  );
}
