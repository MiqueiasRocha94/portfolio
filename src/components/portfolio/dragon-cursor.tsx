"use client";

import { useEffect, useRef } from "react";

import { useDevice } from "@/contexts/DeviceContext";

type Point = { x: number; y: number };
/** `turn`: giro do corpo sobre o próprio eixo (graus) — 0 de lado, 90 de costas, 180 do outro lado. */
type Part = Point & { angle: number; flipped: boolean; turn: number };
type PartType = "head" | "segment" | "tail";
type TurningPart = Exclude<PartType, "head">;
type LegPair = "front" | "back";
type ImageKey = "head" | "jaw" | "frontLegLeft" | "frontLegRight" | "backLegLeft" | "backLegRight";

const IMAGES: Record<ImageKey, string> = {
  head: "/portfolio/dragon-head.png",
  jaw: "/portfolio/dragon-jaw.png",
  frontLegLeft: "/portfolio/dragon-leg-front-left.png",
  frontLegRight: "/portfolio/dragon-leg-front-right.png",
  backLegLeft: "/portfolio/dragon-leg-back-left.png",
  backLegRight: "/portfolio/dragon-leg-back-right.png",
};

/** Quadros do giro (graus) do segmento e da ponta da cauda, da vista de lado às costas. */
const TURN_ANGLES = [0, 30, 45, 60, 90];
const TURN_IMAGES: Record<TurningPart, string[]> = {
  segment: TURN_ANGLES.map((angle) => (angle ? `/portfolio/dragon-segment-turn-${angle}.png` : "/portfolio/dragon-segment.png")),
  tail: TURN_ANGLES.map((angle) => (angle ? `/portfolio/dragon-tail-tip-turn-${angle}.png` : "/portfolio/dragon-tail-tip.png")),
};
/** Faixa do cosseno do rumo em que o corpo gira: fora dela, de lado; no meio (rumo vertical), de costas. */
const TURN_WIDTH = 0.35;

// Pontos do rig em fração da imagem (0–1); cabeça e mandíbula dividem o mesmo quadro quadrado.
const JAW_PIVOT: Point = { x: 0.714, y: 0.547 };
const MOUTH_CORNER: Point = { x: 0.894, y: 0.547 };
const EYE: Point = { x: 0.687, y: 0.465 };
/** Ponto da cabeça (atrás do crânio) que fica no lugar da peça; a crina cobre o pescoço. */
const HEAD_ANCHOR = 0.574;
/**
 * Pares de patas no quadro do segmento: a esquerda (lado de lá) vai atrás do
 * corpo, a direita (lado de cá) na frente; os lados e os pares alternam o passo.
 */
const LEGS: Record<LegPair, { left: ImageKey; right: ImageKey; hip: Point; scale: number; phase: number }> = {
  front: { left: "frontLegLeft", right: "frontLegRight", hip: { x: 0.5, y: 0.56 }, scale: 1, phase: 0 },
  back: { left: "backLegLeft", right: "backLegRight", hip: { x: 0.5, y: 0.54 }, scale: 1.15, phase: Math.PI },
};
/** Pata do lado de lá um pouco à frente, para aparecer atrás do corpo. */
const FAR_LEG_OFFSET = 0.06;

const IDLE_TIME_MS = 2000;
/** Maior passo de tempo por quadro (s): evita saltos ao voltar de uma aba oculta. */
const MAX_DT = 0.05;
/** Curvatura máxima da cabeça (rad/s); o raio da curva é velocidade / giro. */
const TURN_RATE = 2.6;
const CHASE_TURN_RATE = 4.5;
/** Ondulação do trajeto: amplitude (rad) e frequência (rad/s). */
const WAVE_AMPLITUDE = 0.35;
const WAVE_FREQUENCY = 3;
/** Passo das patas: amplitude (rad) e frequência (rad/s). */
const LEG_SWING = 0.35;
const LEG_FREQUENCY = 5;
/** Abertura da boca (rad): na rota e perseguindo; a boca respira em torno dela. */
const MOUTH_OPEN = 0.12;
const MOUTH_OPEN_CHASE = 0.32;
const MOUTH_FREQUENCY = 2.2;
/** Balanço próprio da cabeça (rad) e pulso do brilho do olho (rad/s). */
const HEAD_BOB = 0.05;
const EYE_PULSE = 3.5;
/** Histerese da virada da cabeça: só espelha quando passa claramente para o outro lado. */
const FLIP_THRESHOLD = 0.2;
/** Empurrão da rolagem: ganho (px/s por px rolado), teto (px/s) e amortecimento (1/s). */
const SCROLL_PUSH_GAIN = 1.5;
const SCROLL_PUSH_MAX = 300;
const SCROLL_PUSH_DECAY = 5;
/** Acima deste empurrão (px/s), o dragão nada no sentido da rolagem. */
const SCROLL_STEER = 150;
/** O card conta como à vista quando ocupa esta faixa central da tela. */
const ORBIT_VIEW_MARGIN = 0.25;
/** Com o card à vista, voa livre por este tempo (ms) entre uma volta e outra em torno dele. */
const ORBIT_FREE_MS = 7000;

// Pontos estratégicos da tela, por índice:
// 0  4  1
// 6  8  7
// 2  5  3
const ROUTE_MOBILE = [0, 1, 3, 2, 0, 3, 2, 1, 0, 3, 1, 2];
const ROUTE_DESKTOP = [0, 1, 3, 2, 0, 8, 1, 7, 5, 6, 4, 3, 5, 6, 1, 7, 3, 8, 2, 0, 8, 1, 3];

const normalizeAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));

/**
 * Dragão em canvas, numa camada fixa do tamanho da tela, que percorre a tela
 * sozinho, em curvas. Com mouse de verdade (`any-pointer: fine`, eventos de
 * ponteiro do tipo `mouse`), persegue o ponteiro sobre a área marcada com
 * `data-dragon-chase`; ao sair (ou parado por 2 s), volta à rota. Com o
 * elemento `data-dragon-orbit` (o card da home) à vista, alterna o voo livre
 * com uma volta atrás dele a cada poucos segundos. A rolagem o empurra no
 * mesmo sentido. Na view mobile, menor e numa rota
 * própria. Decorativo: não captura eventos.
 */
export function DragonCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { view } = useDevice();
  const isMobile = view === "mobile";

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }

    const baseSize = isMobile ? 50 : 150;
    const spacing = baseSize * 0.28;
    const edge = isMobile ? 30 : 100;
    const route = isMobile ? ROUTE_MOBILE : ROUTE_DESKTOP;
    const speed = isMobile ? 110 : 280;
    const chaseSpeed = isMobile ? 110 : 380;
    // Troca de alvo antes de entrar no raio de curva, para não ficar circulando o ponto.
    const arriveDistance = Math.max(baseSize, (speed / TURN_RATE) * 1.4);
    const neck = isMobile ? 5 : 10;
    const body = isMobile ? 10 : 20;
    const tail = isMobile ? 10 : 20;

    const structure: { type: PartType; size: number; legs?: LegPair }[] = [
      { type: "head", size: baseSize * 1.8 },
      // Pescoço afina do corpo para a cabeça.
      ...Array.from({ length: neck }, (_, i) => ({
        type: "segment" as const,
        size: baseSize * (0.75 + (0.25 * i) / Math.max(neck - 1, 1)),
      })),
      { type: "segment", size: baseSize, legs: "front" },
      ...Array.from({ length: body }, () => ({ type: "segment" as const, size: baseSize })),
      { type: "segment", size: baseSize, legs: "back" },
      ...Array.from({ length: tail }, (_, i) => ({ type: "segment" as const, size: baseSize * (1 - i * 0.035) })),
      { type: "tail", size: baseSize },
    ];
    const gap = (i: number) => (structure[i].size / baseSize) * spacing;

    const load = (src: string) => {
      const img = new Image();
      img.src = src;
      return img;
    };
    const images = Object.fromEntries(Object.entries(IMAGES).map(([key, src]) => [key, load(src)])) as Record<
      ImageKey,
      HTMLImageElement
    >;
    const turnImages: Record<TurningPart, HTMLImageElement[]> = {
      segment: TURN_IMAGES.segment.map(load),
      tail: TURN_IMAGES.tail.map(load),
    };

    let width = 0;
    let height = 0;
    let dpr = 1;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.imageSmoothingQuality = "high";
    };
    resize();

    const points = (): Point[] => [
      { x: edge, y: edge },
      { x: width - edge, y: edge },
      { x: edge, y: height - edge },
      { x: width - edge, y: height - edge },
      { x: width / 2, y: edge },
      { x: width / 2, y: height - edge },
      { x: edge, y: height / 2 },
      { x: width - edge, y: height / 2 },
      { x: width / 2, y: height / 2 },
    ];

    const parts: Part[] = structure.map(() => ({ x: 0, y: 0, angle: 0, flipped: false, turn: 0 }));

    /** Corpo já formado atrás da cabeça, em S suave (entrada). */
    const layPose = (head: Point, heading: number) => {
      let { x, y } = head;
      parts.forEach((part, i) => {
        const angle = heading + 0.5 * Math.sin(i * 0.22);
        if (i > 0) {
          x -= Math.cos(angle) * gap(i);
          y -= Math.sin(angle) * gap(i);
        }
        part.x = x;
        part.y = y;
        part.angle = angle;
        part.flipped = Math.cos(angle) < 0;
      });
    };

    let mouthOpen = MOUTH_OPEN;

    /** Cabeça em camadas: interior da boca, mandíbula girando no pivô, cabeça e brilho do olho. */
    const drawHead = (left: number, top: number, size: number, time: number) => {
      const at = (p: Point) => ({ x: left + p.x * size, y: top + p.y * size });
      const pivot = at(JAW_PIVOT);
      const corner = at(MOUTH_CORNER);
      const jaw = mouthOpen * (0.6 + 0.4 * Math.sin(time * MOUTH_FREQUENCY));
      const dx = corner.x - pivot.x;
      const dy = corner.y - pivot.y;
      const lower = {
        x: pivot.x + dx * Math.cos(jaw) - dy * Math.sin(jaw),
        y: pivot.y + dx * Math.sin(jaw) + dy * Math.cos(jaw),
      };
      const glow = ctx.createLinearGradient(pivot.x, pivot.y, corner.x, corner.y);
      glow.addColorStop(0, "rgb(15, 0, 0)");
      glow.addColorStop(1, "rgb(70, 8, 4)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.moveTo(pivot.x, pivot.y);
      ctx.lineTo(corner.x, corner.y);
      ctx.lineTo(lower.x, lower.y);
      ctx.closePath();
      ctx.fill();

      ctx.save();
      ctx.translate(pivot.x, pivot.y);
      ctx.rotate(jaw);
      ctx.drawImage(images.jaw, left - pivot.x, top - pivot.y, size, size);
      ctx.restore();

      ctx.drawImage(images.head, left, top, size, size);

      const eye = at(EYE);
      const radius = size * 0.03;
      const shine = ctx.createRadialGradient(eye.x, eye.y, 0, eye.x, eye.y, radius);
      shine.addColorStop(0, `rgba(255, 140, 40, ${0.55 + 0.35 * Math.sin(time * EYE_PULSE)})`);
      shine.addColorStop(1, "rgba(255, 40, 0, 0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = shine;
      ctx.fillRect(eye.x - radius, eye.y - radius, radius * 2, radius * 2);
      ctx.globalCompositeOperation = "source-over";
    };

    /**
     * Uma pata girando no quadril; a imagem usa o mesmo quadro do segmento. Some
     * conforme o corpo gira para mostrar as costas, onde o quadril não aparece.
     */
    const drawLeg = (pair: LegPair, side: "left" | "right", size: number, time: number, turn: number) => {
      const visible = Math.abs(Math.cos((turn * Math.PI) / 180));
      if (visible < 0.02) {
        return;
      }
      const { hip, scale, phase } = LEGS[pair];
      const legSize = size * scale;
      const far = side === "left";
      ctx.save();
      ctx.globalAlpha = visible;
      ctx.translate((hip.x - 0.5 + (far ? FAR_LEG_OFFSET : 0)) * size, (hip.y - 0.5) * size);
      ctx.rotate(LEG_SWING * Math.sin(time * LEG_FREQUENCY + phase + (far ? Math.PI : 0)));
      ctx.drawImage(images[LEGS[pair][side]], -hip.x * legSize, -hip.y * legSize, legSize, legSize);
      ctx.restore();
    };

    /**
     * Posiciona o quadro da peça (centro, rumo e espelhamento) no canvas. O corpo
     * gira pelo rumo de cada peça (de costas na vertical); como peças vizinhas têm
     * rumos parecidos, o giro corre ao longo do corpo sem quebra. A cabeça só
     * espelha, com histerese.
     */
    const place = (i: number, time: number) => {
      const part = parts[i];
      const cos = Math.cos(part.angle);
      if (i === 0) {
        if (cos < -FLIP_THRESHOLD) {
          part.flipped = true;
        } else if (cos > FLIP_THRESHOLD) {
          part.flipped = false;
        }
      } else {
        part.turn = 90 * (1 - Math.max(-1, Math.min(1, cos / TURN_WIDTH)));
        part.flipped = part.turn > 90;
      }
      const angle = part.angle + (i === 0 ? HEAD_BOB * Math.sin(time * 1.7) : 0);
      const flip = part.flipped ? -1 : 1;
      const sin = Math.sin(angle) * dpr;
      const c = Math.cos(angle) * dpr;
      ctx.setTransform(c, sin, -sin * flip, c * flip, part.x * dpr, part.y * dpr);
    };

    /** Quadro do giro mais próximo; do outro lado das costas, o mesmo quadro espelhado (por `place`). */
    const turnFrame = (type: TurningPart, turn: number) => {
      const view = turn > 90 ? 180 - turn : turn;
      const index = TURN_ANGLES.reduce(
        (best, angle, i) => (Math.abs(angle - view) < Math.abs(TURN_ANGLES[best] - view) ? i : best),
        0,
      );
      return turnImages[type][index];
    };

    // Ordem: patas do lado de lá, corpo da cauda ao pescoço, patas do lado de cá e a cabeça.
    const draw = (time: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = parts.length - 1; i > 0; i--) {
        const { type, size, legs } = structure[i];
        place(i, time);
        if (legs) {
          drawLeg(legs, "left", size, time, parts[i].turn);
        }
        ctx.drawImage(turnFrame(type === "tail" ? "tail" : "segment", parts[i].turn), -size / 2, -size / 2, size, size);
      }
      structure.forEach(({ size, legs }, i) => {
        if (legs) {
          place(i, time);
          drawLeg(legs, "right", size, time, parts[i].turn);
        }
      });
      place(0, time);
      const size = structure[0].size;
      drawHead(-size * HEAD_ANCHOR, -size / 2, size, time);
    };

    let cancelled = false;
    let frame = 0;
    const cleanups: (() => void)[] = [];
    const listen = <K extends keyof WindowEventMap>(target: Window | HTMLElement, type: K, handler: (event: WindowEventMap[K]) => void) => {
      target.addEventListener(type, handler as EventListener);
      cleanups.push(() => target.removeEventListener(type, handler as EventListener));
    };

    const start = () => {
      canvas.style.opacity = "1";

      const mouse = { x: 0, y: 0 };
      let routeIndex = 0;
      let target = points()[route[routeIndex]];
      let autonomous = true;
      let lastMove = 0;
      let heading = 0;
      let last = performance.now();

      let push = 0;
      let orbitIndex = -1;
      let orbiting = false;
      let orbitSteps = 0;
      let freeSince = 0;
      const orbitElement = () => document.querySelector<HTMLElement>("[data-dragon-orbit]");

      /** Contorno do card (cantos e meios das bordas, em sentido horário), dentro da tela. */
      const orbitPoints = (rect: DOMRect): Point[] => {
        const margin = baseSize * 0.6;
        const clampX = (x: number) => Math.min(width - edge, Math.max(edge, x));
        const clampY = (y: number) => Math.min(height - edge, Math.max(edge, y));
        const left = clampX(rect.left - margin);
        const right = clampX(rect.right + margin);
        const top = clampY(rect.top - margin);
        const bottom = clampY(rect.bottom + margin);
        const midX = (left + right) / 2;
        const midY = (top + bottom) / 2;
        return [
          { x: left, y: top },
          { x: midX, y: top },
          { x: right, y: top },
          { x: right, y: midY },
          { x: right, y: bottom },
          { x: midX, y: bottom },
          { x: left, y: bottom },
          { x: left, y: midY },
        ];
      };

      /** Retângulo do card quando ele está à vista; `null` fora dela. */
      const visibleOrbit = (): DOMRect | null => {
        const rect = orbitElement()?.getBoundingClientRect();
        if (!rect || rect.top > height * (1 - ORBIT_VIEW_MARGIN) || rect.bottom < height * ORBIT_VIEW_MARGIN) {
          return null;
        }
        return rect;
      };

      const nextTarget = () => {
        routeIndex = (routeIndex + 1) % route.length;
        target = points()[route[routeIndex]];
      };

      // Entra voando pela esquerda, já formado, rumo ao primeiro ponto da rota.
      const entry = { x: -baseSize, y: height * 0.4 };
      heading = Math.atan2(target.y - entry.y, target.x - entry.x);
      layPose(entry, heading);

      const update = (dt: number, time: number) => {
        const head = parts[0];
        const orbit = visibleOrbit();
        const now = performance.now();
        if (orbit && !orbiting && now - freeSince > ORBIT_FREE_MS) {
          orbiting = true;
          orbitIndex = -1;
          orbitSteps = 0;
        }
        if (orbiting && orbit) {
          // Uma volta no card: começa pelo ponto do contorno mais perto e segue em volta.
          autonomous = true;
          const around = orbitPoints(orbit);
          const distanceTo = (point: Point) => Math.hypot(point.x - head.x, point.y - head.y);
          if (orbitIndex < 0) {
            orbitIndex = around.reduce((best, point, index) => (distanceTo(point) < distanceTo(around[best]) ? index : best), 0);
          }
          if (distanceTo(around[orbitIndex]) < arriveDistance) {
            orbitIndex = (orbitIndex + 1) % around.length;
            orbitSteps += 1;
          }
          target = around[orbitIndex];
          if (orbitSteps > around.length) {
            orbiting = false;
            freeSince = now;
            target = points()[route[routeIndex]];
          }
        } else {
          if (orbiting) {
            orbiting = false;
            freeSince = now;
            target = points()[route[routeIndex]];
          }
          if (!autonomous && now - lastMove > IDLE_TIME_MS) {
            autonomous = true;
          }
          if (autonomous && Math.hypot(target.x - head.x, target.y - head.y) < arriveDistance) {
            nextTarget();
          }
        }
        push *= Math.exp(-SCROLL_PUSH_DECAY * dt);
        mouthOpen += ((autonomous ? MOUTH_OPEN : MOUTH_OPEN_CHASE) - mouthOpen) * Math.min(1, dt * 4);
        // Rolando, nada no sentido da rolagem (para baixo ao descer, para cima ao subir).
        const swimming = Math.abs(push) > SCROLL_STEER;
        const goal = swimming
          ? { x: head.x + Math.cos(heading) * baseSize, y: head.y + Math.sign(push) * baseSize * 2 }
          : autonomous
            ? target
            : mouse;
        const turn = (autonomous ? TURN_RATE : CHASE_TURN_RATE) * dt;
        const desired = Math.atan2(goal.y - head.y, goal.x - head.x);
        heading = normalizeAngle(heading + Math.max(-turn, Math.min(turn, normalizeAngle(desired - heading))));

        // A ondulação entra só no trajeto; o corpo, seguindo a cabeça, propaga a onda.
        const direction = heading + WAVE_AMPLITUDE * Math.sin(time * WAVE_FREQUENCY);
        const step = (autonomous ? speed : chaseSpeed) * dt;
        head.x += Math.cos(direction) * step;
        head.y += Math.sin(direction) * step + push * dt;
        head.angle = direction;

        for (let i = 1; i < parts.length; i++) {
          const prev = parts[i - 1];
          const curr = parts[i];
          const dx = prev.x - curr.x;
          const dy = prev.y - curr.y;
          const distance = Math.hypot(dx, dy) || 1;
          curr.angle = Math.atan2(dy, dx);
          const offset = distance - gap(i);
          curr.x += (dx / distance) * offset;
          curr.y += (dy / distance) * offset;
        }
      };

      const animate = (now: number) => {
        const dt = Math.min((now - last) / 1000, MAX_DT);
        last = now;
        update(dt, now / 1000);
        draw(now / 1000);
        frame = requestAnimationFrame(animate);
      };

      listen(window, "resize", resize);

      // Rolagem de qualquer área (a home rola dentro do MainContent): captura no window.
      const scrollTops = new WeakMap<Element, number>();
      const onScroll = (event: Event) => {
        const source = event.target === document ? document.scrollingElement : event.target;
        if (!(source instanceof Element)) {
          return;
        }
        const previous = scrollTops.get(source) ?? source.scrollTop;
        scrollTops.set(source, source.scrollTop);
        const delta = source.scrollTop - previous;
        push = Math.max(-SCROLL_PUSH_MAX, Math.min(SCROLL_PUSH_MAX, push + delta * SCROLL_PUSH_GAIN));
      };
      window.addEventListener("scroll", onScroll, { capture: true, passive: true });
      cleanups.push(() => window.removeEventListener("scroll", onScroll, { capture: true }));

      // Perseguição só com mouse de verdade; no toque, o dragão anda livre.
      if (window.matchMedia("(any-pointer: fine)").matches) {
        listen(window, "pointermove", (event) => {
          if (event.pointerType !== "mouse") {
            return;
          }
          if (orbiting || !(event.target instanceof Element && event.target.closest("[data-dragon-chase]"))) {
            autonomous = true;
            return;
          }
          mouse.x = event.clientX;
          mouse.y = event.clientY;
          lastMove = performance.now();
          autonomous = false;
        });
        listen(document.documentElement, "mouseleave", () => {
          autonomous = true;
        });
      }
      frame = requestAnimationFrame(animate);
    };

    // Só começa com as imagens decodificadas: todas as partes surgem juntas.
    Promise.all([...Object.values(images), ...turnImages.segment, ...turnImages.tail].map((img) => img.decode()))
      .then(() => {
        if (!cancelled) {
          start();
        }
      })
      .catch((error: unknown) => {
        console.error("Falha ao carregar as imagens do dragão", error);
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [isMobile]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 opacity-0 transition-opacity duration-500 drop-shadow-[0_0_10px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]"
    />
  );
}
