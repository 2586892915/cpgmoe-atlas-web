"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { Logo } from "@/components/logo";

const LINKS = [
  { href: "/datasets", label: "Datasets", note: "Synthetic catalogue and audit states" },
  { href: "/atlas", label: "Cell Atlas", note: "Interactive synthetic embedding" },
  { href: "/browser", label: "Gene & CpG", note: "Gene, probe, or GRCh38 interval" },
  { href: "/compare", label: "Compare Groups", note: "Delta predicted methylation layout" },
  { href: "/downloads", label: "Downloads & API", note: "Contract and planned products" },
  { href: "/methods", label: "Methods", note: "Model boundaries and conventions" },
  { href: "/about", label: "About", note: "Scope, policies, and citations" },
];

export function CinematicHeader() {
  const pathname = usePathname();
  const [overHero, setOverHero] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const hero = document.querySelector("[data-cinematic-hero]");
      const bottom = hero ? hero.getBoundingClientRect().bottom : 0;
      setOverHero(bottom > 64);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          overHero
            ? "border-transparent bg-transparent"
            : "border-b border-[#C9D8F5] bg-[#E7EEFF]/95 backdrop-blur"
        }`}
      >
        <div className="flex h-14 items-stretch">
          <div className="ml-3 my-1 flex h-12 items-stretch border border-[#2A3A8A] bg-[#0A1240] shadow-[0_6px_24px_rgba(3,10,40,0.16)]">
            <Link
              href="/"
              className="flex items-center px-3"
              aria-label="CPGMoE Atlas home"
            >
              <Logo theme="dark" />
            </Link>
            <button
              type="button"
              className="flex w-12 items-center justify-center border-l border-white/10 text-[#E6F1FF] transition-colors hover:bg-white/[0.06]"
              aria-label="Open navigation"
              aria-expanded={open}
              aria-controls="cinematic-menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center px-4">
            <span
              className={`hidden text-[11px] sm:block ${
                overHero ? "text-[#A9BCEB]" : "text-[#475569]"
              }`}
            >
              从转录组推断单细胞甲基化
            </span>
          </div>

          <Link
            href="/browser"
            aria-label="Search the atlas"
            className="mr-3 my-1 flex h-12 w-12 items-center justify-center border border-[#2A3A8A] bg-[#0A1240] text-[#DCE7FF] shadow-[0_6px_24px_rgba(3,10,40,0.16)] transition-colors hover:bg-[#131C5C]"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {open ? (
        <div
          id="cinematic-menu"
          className="fixed inset-0 z-[80] overflow-y-auto bg-[#050A2E]/98 text-white backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Atlas navigation"
        >
          <div className="mx-auto flex min-h-screen w-full max-w-shell flex-col px-5 py-4 sm:px-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <Logo theme="dark" />
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center border border-white/15 text-white transition-colors hover:bg-white/10"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="grid flex-1 content-center gap-1 py-8 sm:grid-cols-2 sm:gap-x-12">
              {LINKS.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex items-baseline gap-4 border-b border-white/10 py-4 transition-colors ${
                    pathname === link.href ? "text-[#8FA9FF]" : "text-white hover:text-[#8FA9FF]"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <span className="font-mono text-[10px] text-[#5F7085]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[24px] font-medium leading-tight sm:text-[30px]">
                      {link.label}
                    </span>
                    <span className="mt-1 block text-[11px] text-[#7F93C8]">
                      {link.note}
                    </span>
                  </span>
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-1 border-t border-white/10 py-4 text-[10px] text-[#5F7085] sm:flex-row sm:items-center sm:justify-between">
              <span>CPGMoE Atlas · Full-S3 CPGMoE · Research preview</span>
              <span>Synthetic visualization · no experimental data</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
