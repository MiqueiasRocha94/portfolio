"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { ScreenLayout } from "@/components/layout/screen-layout";
import {
  AboutSection,
  EducationSection,
  SectionDivider,
  StatsSection,
  TechnologiesSection,
  TimelineSection,
} from "@/components/portfolio/profile-sections";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChatAvailable } from "@/hooks/use-chat-available";
import { usePortfolioText } from "@/hooks/use-portfolio-text";
import { SOCIAL_LINKS } from "@/lib/portfolio/content";

/**
 * Página "Sobre mim" (`/sobre-mim`): perfil, trajetória, tecnologias e atalhos
 * para o Uriel, só com o chat ligado. Header e barra inferior vêm do shell (RouteMeta).
 */
export function ProfileScreen() {
  const t = usePortfolioText();
  const { dictionary } = useLanguage();
  const chat = useChatAvailable() === true;
  const [showScrollTop, setShowScrollTop] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // Quem rola é o conteúdo do shell (MainContent), não a janela.
  const scroller = () => rootRef.current?.closest<HTMLElement>('[data-layout-scroll="content"]') ?? null;

  useEffect(() => {
    const container = rootRef.current?.closest<HTMLElement>('[data-layout-scroll="content"]');
    if (!container) return;
    const onScroll = () => {
      const pageHeight = container.scrollHeight - container.clientHeight;
      setShowScrollTop(container.scrollTop > pageHeight / 2);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [t]);

  if (!t) {
    return null;
  }

  return (
    <ScreenLayout title={dictionary.nav.about}>
      <div ref={rootRef} className="flex-1 bg-background text-text">
        <div className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{ backgroundImage: "radial-gradient(120% 90% at 85% 0%, color-mix(in srgb, var(--color-primary) 18%, transparent), transparent 55%)" }}
          />

          <div className="relative mx-auto max-w-6xl px-5 pb-20">
            <section className="grid grid-cols-1 items-center justify-items-center gap-8 pt-10 text-center desktop:grid-cols-[160px_1fr] desktop:justify-items-start desktop:text-left">
              <div className="relative size-40 overflow-hidden rounded-3xl border border-primary/40 shadow-[0_0_30px_color-mix(in_srgb,var(--color-primary)_25%,transparent)]">
                <Image src="/portfolio/profile-photo.png" alt={t.profile.photoAlt} fill sizes="160px" className="object-cover object-[50%_20%]" />
              </div>
              <div>
                <p className="font-display text-[11px] uppercase tracking-[0.3em] text-primary">{t.profile.kicker}</p>
                <h1 className="font-display mt-3 text-3xl font-bold leading-tight text-text drop-shadow-[0_0_20px_color-mix(in_srgb,var(--color-primary)_30%,transparent)] sm:text-4xl">
                  {t.header.title}
                </h1>
                <p className="mt-4 max-w-2xl leading-relaxed text-text-muted">{t.header.description}</p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3 desktop:justify-start">
                  <a
                    href={SOCIAL_LINKS.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-display rounded-xl bg-primary px-6 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-on-primary transition hover:-translate-y-0.5 hover:shadow-[0_6px_30px_color-mix(in_srgb,var(--color-primary)_50%,transparent)]"
                  >
                    {t.profile.projects}
                  </a>
                  {chat && (
                    <Link
                      href="/chat"
                      className="font-display rounded-xl border border-primary/40 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-text transition hover:border-primary hover:bg-text/5"
                    >
                      {t.profile.talk}
                    </Link>
                  )}
                </div>
              </div>
            </section>

            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl border border-primary/25 bg-text/[0.02] px-6 py-5 md:flex md:flex-wrap md:gap-x-10">
              {t.profile.facts.map((fact) => (
                <div key={fact.k} className="flex flex-col gap-0.5">
                  <span className="font-display text-[10px] uppercase tracking-[0.2em] text-text-muted">{fact.k}</span>
                  <span className="text-sm font-semibold text-text">{fact.v}</span>
                </div>
              ))}
              <div className="hidden md:block md:flex-1" />
              <div className="flex flex-col gap-0.5">
                <span className="font-display text-[10px] uppercase tracking-[0.2em] text-text-muted">{t.profile.status}</span>
                <span className="text-sm font-semibold text-text">
                  <span className="text-success">● </span>
                  {t.profile.open}
                </span>
              </div>
            </div>

            <div className="mt-12 space-y-12 rounded-3xl border border-primary/25 bg-text/[0.015] p-6 sm:p-10">
              <AboutSection t={t} />
              <SectionDivider delaySeconds={0.2} />
              <TimelineSection t={t} />
              <SectionDivider delaySeconds={0.4} />
              <TechnologiesSection t={t} />
              <SectionDivider delaySeconds={0.6} />
              <EducationSection t={t} />
              <SectionDivider delaySeconds={0.8} />
              <StatsSection t={t} />
            </div>

            {chat && (
              <div className="mt-12 rounded-2xl border border-primary/30 bg-background/40 p-6 sm:p-8">
                <p className="font-display flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-text-muted">
                  <span className="ember-pulse size-2 rounded-full bg-success shadow-[0_0_9px_var(--color-success)]" />
                  {t.profile.urielKicker}
                </p>
                <p className="mt-3 text-text-muted">{t.profile.urielText}</p>
                <Link
                  href="/chat"
                  className="font-code mt-5 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-text/[0.03] px-5 py-3 text-sm text-text transition hover:border-primary hover:text-text"
                >
                  <span className="text-primary">✦</span> {t.profile.urielCta}
                </Link>
              </div>
            )}
          </div>
        </div>

        {showScrollTop && (
          <button
            type="button"
            onClick={() => scroller()?.scrollTo({ top: 0, left: 0, behavior: "smooth" })}
            aria-label={t.profile.backToTop}
            className="fixed bottom-[calc(var(--app-safe-bottom,0px)+1.5rem)] left-6 z-50 mobile:bottom-[calc(var(--app-safe-bottom,0px)+5rem)] rounded-full border border-primary/60 bg-background/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-primary shadow-[0_0_12px_color-mix(in_srgb,var(--color-primary)_35%,transparent)] backdrop-blur-md transition hover:text-primary-strong"
          >
            {t.profile.top}
          </button>
        )}
      </div>
    </ScreenLayout>
  );
}
