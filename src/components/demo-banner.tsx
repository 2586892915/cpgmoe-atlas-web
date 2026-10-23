"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { DATA_MODE_BANNER } from "@/lib/data-mode";

export function DemoBanner() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <div className="border-b border-warm/25 bg-warm-wash">
      <div className="shell flex min-h-8 flex-wrap items-center gap-x-2 gap-y-0 py-1 text-[12px] text-warm">
        <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="font-semibold">{DATA_MODE_BANNER}</span>
        <span className="hidden text-warm/80 sm:inline">
          Illustrative values only.
        </span>
        <Link
          href="/methods#data-status"
          className="ml-auto underline decoration-warm/40 underline-offset-2 hover:decoration-warm"
        >
          Details
        </Link>
      </div>
    </div>
  );
}
