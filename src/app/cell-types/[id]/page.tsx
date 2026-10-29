import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getCellTypeSignature, SIGNATURE_META } from "@/lib/signatures";

export const metadata: Metadata = {
  title: "Cell type",
};

export default async function CellTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const index = Number(id);
  if (!Number.isInteger(index)) notFound();
  const signature = getCellTypeSignature(index);
  if (!signature) notFound();

  return (
    <div className="shell py-8">
      <div className="flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/atlas" className="text-[11px] text-ink-faint hover:text-primary">
            ← Atlas
          </Link>
          <h1 className="mt-1 text-[28px] font-semibold leading-tight text-ink">
            {signature.label}
          </h1>
          <p className="mt-1 text-[14px] text-ink-soft">
            Cell type · predicted methylation profile
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {signature.supported ? (
            <Badge tone="primary" dot>
              ≥100 cells
            </Badge>
          ) : (
            <Badge tone="warm" dot>
              Exploratory support
            </Badge>
          )}
          <Badge tone="neutral">{signature.n_datasets} studies</Badge>
        </div>
      </div>

      <div className="mt-5 grid gap-px border border-line bg-line sm:grid-cols-4">
        {[
          ["Cells", signature.n_cells.toLocaleString("en-US")],
          ["Donors", signature.n_donors.toLocaleString("en-US")],
          ["Studies", `${signature.n_datasets}`],
          ["Signature CpGs", `${signature.top.length}`],
        ].map(([label, value]) => (
          <div key={label} className="bg-white px-4 py-3">
            <p className="text-[9px] uppercase text-ink-faint">{label}</p>
            <p className="tabular mt-1 text-[18px] font-medium leading-none text-ink">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-7 flex items-end justify-between border-b border-line pb-2">
        <div>
          <p className="micro-label">Top predicted deviations</p>
          <p className="mt-1 text-[11px] text-ink-faint">
            Ranked by |β − panel mean|, restricted to CpGs with variance ≥{" "}
            {SIGNATURE_META.min_variance}.
          </p>
        </div>
      </div>

      <div className="border-y border-line">
        <div className="hidden grid-cols-[1.1fr_1.6fr_0.6fr_0.6fr_auto] gap-3 px-2 py-2 text-[10px] uppercase text-ink-faint sm:grid">
          <span>CpG</span>
          <span>Gene</span>
          <span className="text-right">β</span>
          <span className="text-right">Δβ</span>
          <span />
        </div>
        {signature.top.map((cpg) => (
          <Link
            key={cpg.cpg_id}
            href={`/browser?q=${cpg.cpg_id}&cpg=${cpg.cpg_id}`}
            className="group grid gap-1 border-t border-line px-2 py-2.5 transition-colors hover:bg-paper-tint sm:grid-cols-[1.1fr_1.6fr_0.6fr_0.6fr_auto] sm:items-center sm:gap-3"
          >
            <span className="mono text-[11px] text-ink">{cpg.cpg_id}</span>
            <span className="truncate text-[11px] text-ink-soft">
              {cpg.gene ?? "—"}
            </span>
            <span className="tabular text-[11px] text-ink sm:text-right">
              {cpg.beta.toFixed(3)}
            </span>
            <span
              className={`tabular text-[11px] sm:text-right ${
                cpg.delta >= 0 ? "text-primary" : "text-warm"
              }`}
            >
              {cpg.delta >= 0 ? "+" : ""}
              {cpg.delta.toFixed(3)}
            </span>
            <span />
          </Link>
        ))}
      </div>

      <p className="mt-4 max-w-3xl text-[11px] leading-relaxed text-ink-faint">
        Candidate predicted deviations within this cell type, not validated
        markers. Support: {signature.n_cells.toLocaleString("en-US")} cells /{" "}
        {signature.n_donors} donors / {signature.n_datasets}{" "}
        {signature.n_datasets === 1 ? "study" : "studies"}.
      </p>
    </div>
  );
}
