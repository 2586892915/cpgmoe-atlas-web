"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { CinematicStaticFallback } from "@/components/home/cinematic-static-fallback";

const CinematicCanvas = dynamic(
  () =>
    import("@/components/home/cinematic-canvas").then(
      (module) => module.CinematicCanvas,
    ),
  { ssr: false },
);

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

export function CinematicHero() {
  const [mode, setMode] = useState<"checking" | "live" | "static">("checking");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMode(!reduced && supportsWebGL() ? "live" : "static");
  }, []);

  const live = mode === "live";

  return (
    <section
      data-cinematic-hero
      className={`relative -mt-14 overflow-clip bg-[#050A2E] ${
        live ? "h-[180vh] sm:h-[210vh]" : "h-screen"
      }`}
      aria-labelledby="hero-title"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <CinematicStaticFallback />
        {live ? (
          <div className="absolute inset-0 animate-[heroFade_1.2s_ease-out_both]">
            <CinematicCanvas />
          </div>
        ) : null}

        <div
          className="pointer-events-none absolute inset-x-0 top-[17%] z-10 px-5 text-center sm:top-[18%]"
          style={{
            opacity: "clamp(0, calc(1 - var(--hero-progress, 0) * 3.4), 1)",
            transform: "translateY(calc(var(--hero-progress, 0) * -28px))",
          }}
        >
          <p className="text-[10px] font-medium uppercase text-[#8FA9FF]">
            Predicted single-cell DNA methylation
          </p>
          <h1
            id="hero-title"
            className="mt-4 text-[48px] font-semibold leading-none text-[#F2F6FF] [text-shadow:0_4px_40px_rgba(3,6,22,0.8)] sm:text-[66px] lg:text-[78px]"
          >
            CPGMoE Atlas
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-[#B9C8F5] sm:text-[16px]">
            A transcriptome-derived atlas of predicted single-cell methylation
          </p>
          <div className="pointer-events-auto mt-6">
            <Link
              href="/atlas"
              className="group inline-flex items-center gap-2 border-b border-[#8FA9FF]/60 pb-1 text-[12px] font-medium text-[#DCE7FF] transition-colors hover:border-[#DCE7FF]"
            >
              Enter Atlas
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 px-5 pb-6 text-[10px] text-[#7F93C8] sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <span className="inline-flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-[#E6B36F]" aria-hidden="true" />
            Synthetic visualization · data audit in progress
          </span>
          <span className="hidden flex-col items-center gap-1 text-[#8FA9FF]/70 sm:flex">
            <span>Scroll to explore</span>
            <span className="h-6 w-px bg-gradient-to-b from-[#8FA9FF]/60 to-transparent" />
          </span>
          <span>Powered by Full-S3 CPGMoE · GRCh38</span>
        </div>
      </div>
    </section>
  );
}
