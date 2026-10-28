"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { CinematicHeader } from "@/components/cinematic-header";
import { Logo } from "@/components/logo";
import { IS_PILOT } from "@/lib/data-mode";

const BASE_LINKS = [
  { href: "/datasets", label: "Datasets" },
  { href: "/atlas", label: "Cell Atlas" },
  { href: "/browser", label: "Gene & CpG" },
  { href: "/compare", label: "Compare" },
  { href: "/downloads", label: "Downloads" },
];

const PRIMARY_LINKS = IS_PILOT
  ? [
      { href: "/atlas", label: "Atlas" },
      { href: "/tissues", label: "Tissues" },
      { href: "/browser", label: "Gene & CpG" },
      { href: "/compare", label: "Compare" },
      { href: "/downloads", label: "Downloads" },
    ]
  : BASE_LINKS;

const SECONDARY_LINKS = [
  { href: "/methods", label: "Methods" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (pathname === "/") {
    return <CinematicHeader />;
  }

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-paper/95 backdrop-blur">
      <div className="shell flex h-14 items-center gap-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label="CPGMoE Atlas home">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden h-full items-stretch gap-1 lg:flex">
          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex items-center px-2.5 text-[13px] font-medium transition-colors ${
                isActive(link.href)
                  ? "text-primary"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {link.label}
              {isActive(link.href) ? (
                <span className="absolute inset-x-2.5 bottom-0 h-[2px] bg-primary" />
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <nav aria-label="Secondary" className="hidden items-center gap-1 md:flex">
            {SECONDARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2.5 py-2 text-[13px] ${
                  isActive(link.href)
                    ? "text-primary"
                    : "text-ink-faint hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <span className="ml-2 hidden items-center gap-1.5 border border-warm/30 bg-warm-wash px-2 py-1 text-[11px] font-medium text-warm sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-warm" aria-hidden="true" />
            {IS_PILOT ? "Pilot release" : "Audit in progress"}
          </span>
          <button
            type="button"
            className="btn btn-quiet -mr-2 h-10 w-10 px-0 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-line bg-paper lg:hidden">
          <nav aria-label="Mobile" className="shell grid gap-1 py-3">
            {[...PRIMARY_LINKS, ...SECONDARY_LINKS].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-2 py-2.5 text-sm ${
                  isActive(link.href)
                    ? "bg-primary-wash font-medium text-primary"
                    : "text-ink-soft hover:bg-paper-tint"
                }`}
              >
                {link.label}
                <span className="text-2xs text-ink-faint">{link.href}</span>
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
