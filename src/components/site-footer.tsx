import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-paper-tint">
      <div className="shell grid gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-ink-soft">
            Predicted, panel-based single-cell methylation inferred from RNA
            expression by CPGMoE.
          </p>
        </div>
        <div>
          <p className="micro-label">Portal</p>
          <ul className="mt-3 grid gap-2 text-[13px] text-ink-soft">
            <li><Link className="hover:text-primary" href="/datasets">Explore datasets</Link></li>
            <li><Link className="hover:text-primary" href="/atlas">Cell Atlas</Link></li>
            <li><Link className="hover:text-primary" href="/browser">Gene &amp; CpG Browser</Link></li>
            <li><Link className="hover:text-primary" href="/compare">Compare groups</Link></li>
            <li><Link className="hover:text-primary" href="/downloads">Downloads &amp; API</Link></li>
          </ul>
        </div>
        <div>
          <p className="micro-label">Documentation</p>
          <ul className="mt-3 grid gap-2 text-[13px] text-ink-soft">
            <li><Link className="hover:text-primary" href="/about">About the atlas</Link></li>
            <li><Link className="hover:text-primary" href="/methods">Methods &amp; limitations</Link></li>
            <li><Link className="hover:text-primary" href="/about#data-policies">Data policies</Link></li>
            <li><Link className="hover:text-primary" href="/about#citations">Source &amp; citations</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="shell flex flex-col gap-1 py-4 text-[11px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <span>CPGMoE Atlas · Phase 0</span>
          <span>Synthetic demo only · Research use</span>
        </div>
      </div>
    </footer>
  );
}
