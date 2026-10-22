"use client";

import { useEffect, useRef } from "react";

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Point = { x: number; y: number };

function bezier(a: Point, b: Point, c: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * a.x + 2 * mt * t * b.x + t * t * c.x,
    y: mt * mt * a.y + 2 * mt * t * b.y + t * t * c.y,
  };
}

export function CinematicStaticFallback() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const rng = mulberry32(90210);

    const draw = () => {
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const background = context.createRadialGradient(
        width * 0.5,
        height * 0.4,
        0,
        width * 0.5,
        height * 0.4,
        Math.max(width, height) * 0.82,
      );
      background.addColorStop(0, "#172A7A");
      background.addColorStop(0.48, "#0A1448");
      background.addColorStop(1, "#030616");
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      const scale = Math.min(width, height);
      const left = {
        a: { x: width * 0.37, y: height * 0.28 },
        b: { x: width * 0.47, y: height * 0.53 },
        c: { x: width * 0.33, y: height * 0.82 },
      };
      const right = {
        a: { x: width * 0.63, y: height * 0.28 },
        b: { x: width * 0.53, y: height * 0.53 },
        c: { x: width * 0.67, y: height * 0.82 },
      };
      const radiusAt = (t: number) =>
        (scale * 0.022 + scale * 0.055 * Math.sin(Math.PI * t)) *
        (1 - 0.35 * Math.exp(-Math.pow((t - 0.5) / 0.075, 2)));

      // Helix trails behind the chromosome.
      context.globalCompositeOperation = "lighter";
      const trails = [
        { color: "#2F6BFF", offset: 0 },
        { color: "#4FD1C5", offset: 18 },
        { color: "#D9A45B", offset: 36 },
      ];
      trails.forEach((trail, index) => {
        context.beginPath();
        for (let i = 0; i <= 120; i += 1) {
          const t = i / 120;
          const x = t * width;
          const y =
            height * 0.94 +
            trail.offset +
            Math.sin(t * Math.PI * 2.2 + index * 1.3) * height * 0.06 -
            Math.pow(t, 2) * height * 0.24;
          if (i === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.strokeStyle = trail.color;
        context.globalAlpha = 0.45;
        context.lineWidth = 2;
        context.shadowColor = trail.color;
        context.shadowBlur = 16;
        context.stroke();
      });
      context.globalAlpha = 1;
      context.shadowBlur = 0;
      context.globalCompositeOperation = "source-over";

      // Translucent chromatid envelopes.
      [left, right].forEach((curve) => {
        for (const side of [-1, 1]) {
          context.beginPath();
          for (let i = 0; i <= 100; i += 1) {
            const t = i / 100;
            const point = bezier(curve.a, curve.b, curve.c, t);
            const radius = radiusAt(t) * 1.16;
            const normalX = side * radius;
            if (i === 0) context.moveTo(point.x + normalX, point.y);
            else context.lineTo(point.x + normalX, point.y);
          }
          context.strokeStyle = "rgba(110, 139, 255, 0.26)";
          context.lineWidth = 1;
          context.stroke();
        }
      });

      // Particle chromatids.
      context.globalCompositeOperation = "lighter";
      [left, right].forEach((curve) => {
        for (let i = 0; i < 1400; i += 1) {
          const t = rng();
          const point = bezier(curve.a, curve.b, curve.c, t);
          const radius = radiusAt(t) * (0.52 + 0.48 * Math.sqrt(rng()));
          const angle = rng() * Math.PI * 2;
          const x = point.x + Math.cos(angle) * radius;
          const y = point.y + Math.sin(angle) * radius * 0.88;
          const glow = Math.exp(-Math.pow((t - 0.5) / 0.11, 2));
          const bright = 0.3 + rng() * 0.6;
          context.fillStyle =
            glow > 0.35 && rng() > 0.35
              ? `rgba(255, 182, 213, ${bright})`
              : `rgba(${70 + Math.round(rng() * 120)}, ${110 + Math.round(rng() * 100)}, 255, ${bright})`;
          context.beginPath();
          context.arc(x, y, 0.7 + rng() * 1.5, 0, Math.PI * 2);
          context.fill();
        }
      });

      // Cohesin bridge at the centromere.
      const bridgeGlow = context.createRadialGradient(
        width * 0.5,
        height * 0.53,
        0,
        width * 0.5,
        height * 0.53,
        scale * 0.055,
      );
      bridgeGlow.addColorStop(0, "rgba(255, 213, 174, 0.75)");
      bridgeGlow.addColorStop(0.4, "rgba(255, 182, 213, 0.25)");
      bridgeGlow.addColorStop(1, "rgba(255, 182, 213, 0)");
      context.fillStyle = bridgeGlow;
      context.fillRect(
        width * 0.44,
        height * 0.47,
        width * 0.12,
        height * 0.12,
      );
      for (let i = 0; i < 150; i += 1) {
        const angle = rng() * Math.PI * 2;
        const radius = Math.sqrt(rng());
        const x = width * 0.5 + Math.cos(angle) * radius * width * 0.034;
        const y = height * 0.53 + Math.sin(angle) * radius * height * 0.025;
        context.fillStyle =
          rng() > 0.45
            ? `rgba(255, 182, 213, ${0.35 + rng() * 0.5})`
            : `rgba(217, 164, 91, ${0.3 + rng() * 0.5})`;
        context.beginPath();
        context.arc(x, y, 0.8 + rng() * 1.3, 0, Math.PI * 2);
        context.fill();
      }
      context.globalCompositeOperation = "source-over";
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-cinematic-fallback="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
