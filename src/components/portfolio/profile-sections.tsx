"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  SiAngular,
  SiDocker,
  SiGitlab,
  SiJenkins,
  SiNextdotjs,
  SiPhp,
  SiPrimefaces,
  SiPython,
  SiRubyonrails,
  SiSpringboot,
} from "react-icons/si";

import { GithubIcon } from "@/components/portfolio/brand-icons";
import { useInView } from "@/hooks/use-in-view";
import type { AppDictionary } from "@/lib/i18n/dictionaries";
import {
  GIT_STATS,
  TECHNOLOGIES,
  TIMELINE_KEYS,
  type GitStatsSource,
  type TechnologyIcon,
} from "@/lib/portfolio/content";
import { cn } from "@/lib/utils";

type Text = AppDictionary["portfolio"];

const enter = (visible: boolean) => (visible ? "opacity-0 animate-[slideUpFade_0.7s_ease_forwards]" : "opacity-0");
const delay = (seconds: number): CSSProperties => ({ animationDelay: `${seconds}s` });

function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("font-display text-xl font-bold text-text sm:text-2xl", className)}>{children}</h2>;
}

export function SectionDivider({ delaySeconds = 0 }: { delaySeconds?: number }) {
  const { ref, inView } = useInView<HTMLHRElement>({ threshold: 0.2, once: false });
  return <hr ref={ref} className={cn("border-primary/25", enter(inView))} style={delay(delaySeconds)} />;
}

export function AboutSection({ t }: { t: Text }) {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.2, once: false });
  return (
    <section ref={ref} className="space-y-6">
      <SectionTitle className={enter(inView)}>{t.about.title}</SectionTitle>
      <div className="grid gap-8 leading-relaxed text-text-muted md:grid-cols-2">
        <p className={enter(inView)} style={delay(0.3)}>
          {t.about.paragraph1}
        </p>
        <p className={enter(inView)} style={delay(0.6)}>
          {t.about.paragraph2}
        </p>
      </div>
    </section>
  );
}

export function TimelineSection({ t }: { t: Text }) {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.15, once: true });
  return (
    <section ref={ref} className="space-y-8">
      <SectionTitle>{t.timeline.title}</SectionTitle>
      <div className="relative pl-6 sm:pl-10">
        <div className="absolute inset-y-0 left-0 w-1 rounded-full bg-primary/25" />
        {TIMELINE_KEYS.map((key, index) => {
          const item = t.timeline[key];
          const isCurrent = index === 0;
          return (
            <div key={key} className={cn("relative mb-6 pl-4 sm:pl-8", enter(inView))} style={delay(index * 0.12)}>
              <div
                className={cn(
                  "absolute left-0 top-6 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full",
                  isCurrent ? "bg-primary shadow-[0_0_10px_color-mix(in_srgb,var(--color-primary)_70%,transparent)]" : "bg-primary-strong",
                )}
              />
              <div
                className={cn(
                  "rounded-2xl border bg-text/[0.03] p-6 shadow-lg transition-all duration-300",
                  isCurrent ? "border-primary/70" : "border-primary/25",
                )}
              >
                {isCurrent && <span className="text-xs font-semibold text-success">{t.profile.current}</span>}
                <h3 className="text-lg font-bold text-primary sm:text-xl">{item.role}</h3>
                <p className="font-code mb-2 text-sm text-text-muted">{item.period}</p>
                <p className="text-text-muted">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const TECHNOLOGY_ICONS: Record<TechnologyIcon, IconType> = {
  spring: SiSpringboot,
  rails: SiRubyonrails,
  python: SiPython,
  nextjs: SiNextdotjs,
  angular: SiAngular,
  php: SiPhp,
  primefaces: SiPrimefaces,
  jenkins: SiJenkins,
  docker: SiDocker,
};

export function TechnologiesSection({ t }: { t: Text }) {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.2, once: false });
  return (
    <section ref={ref} className={cn("space-y-8", enter(inView))}>
      <SectionTitle>{t.profile.technologies}</SectionTitle>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {TECHNOLOGIES.map((tech, index) => {
          const Icon = TECHNOLOGY_ICONS[tech.icon];
          return (
            <div
              key={tech.name}
              className={cn(
                "flex flex-col items-center gap-3 rounded-2xl border border-primary/25 bg-text/[0.03] p-6 shadow-lg transition hover:border-primary/60",
                enter(inView),
              )}
              style={delay(0.3 + index * 0.15)}
            >
              <Icon aria-hidden="true" className="size-10" style={{ color: tech.color }} />
              <span className="text-center text-sm font-semibold text-text">{tech.name}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function EducationSection({ t }: { t: Text }) {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.2, once: false });
  return (
    <section ref={ref} className={cn("space-y-6", enter(inView))}>
      <SectionTitle>{t.education.title}</SectionTitle>
      <div className="space-y-4 leading-relaxed text-text-muted">
        <h3 className="text-lg font-bold text-primary">{t.education.degrees.title}</h3>
        <p className="text-sm">{t.education.degrees.university}</p>
        <p>{t.education.degrees.description}</p>
      </div>
    </section>
  );
}

const STATS_DURATION_MS = 5000;
const STAT_ICONS: Record<GitStatsSource, ReactNode> = {
  github: <GithubIcon className="size-12 text-text" />,
  gitlab: <SiGitlab aria-hidden="true" className="size-12 text-text" />,
};

function parseStat(raw: string) {
  const match = raw.trim().match(/^(\d+)(.*)$/);
  return match ? { value: Number(match[1]), suffix: match[2] } : { value: 0, suffix: "" };
}

export function StatsSection({ t }: { t: Text }) {
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.2, once: false });
  const [progress, setProgress] = useState(0);

  // Contagem animada de 0 ao valor enquanto a seção está visível.
  useEffect(() => {
    if (!inView) {
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const next = Math.min((now - start) / STATS_DURATION_MS, 1);
      setProgress(next);
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      setProgress(0);
    };
  }, [inView]);

  return (
    <section ref={ref} className={cn("space-y-8", enter(inView))}>
      <SectionTitle>{t.profile.stats}</SectionTitle>
      <div className="grid gap-8 md:grid-cols-2">
        {(Object.keys(GIT_STATS) as GitStatsSource[]).map((source, index) => (
          <div
            key={source}
            className={cn("rounded-2xl border border-primary/25 bg-text/[0.03] p-8 shadow-lg", enter(inView))}
            style={delay(0.2 + index * 0.1)}
          >
            <div className="mb-4 flex items-center gap-4">
              {STAT_ICONS[source]}
              <h3 className="text-lg font-bold text-text">{t.gitStats[source].title}</h3>
            </div>
            <ul className="space-y-2 text-text-muted">
              {GIT_STATS[source].map((raw, i) => {
                const { value, suffix } = parseStat(raw);
                return (
                  <li key={t.gitStats[source].items[i]} className="flex items-center justify-between">
                    <span className="font-medium">{t.gitStats[source].items[i]}:</span>
                    <span className="font-semibold text-primary">
                      {Math.floor(value * progress)}
                      {suffix}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
