import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "About",
  description:
    "Scope, data policies, and citation placeholders for the CPGMoE Atlas Phase 0 prototype.",
};

export default function AboutPage() {
  return (
    <div className="shell py-8">
      <div className="max-w-3xl">
        <p className="eyebrow">About</p>
        <h1 className="mt-1 text-[28px] font-semibold leading-tight text-ink">
          A predicted methylation atlas, not a measurement archive
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          CPGMoE Atlas is a Phase 0 interface prototype for exploring predicted,
          panel-based single-cell DNA methylation inferred from RNA expression.
          It exists to lock the data contracts, interaction model, and evidence
          boundaries before audited human data and an approved Full-S3
          checkpoint are connected.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="primary" dot>Phase 0 prototype</Badge>
          <Badge tone="warm" dot>Research use only</Badge>
          <Badge tone="neutral">Synthetic demo data</Badge>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="max-w-3xl">
          <section className="border-t border-line py-6 first:border-t-0 first:pt-0">
            <h2 className="text-[18px] font-semibold text-ink">Observed input, inferred output</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              Single-cell RNA expression is the observed input. DNA methylation
              is the model&apos;s inference target. Throughout the portal, model
              values are labelled <em>predicted</em> and never described as
              measured single-cell DNA methylation. A beta value from this
              system is not a substitute for bisulfite sequencing or any
              clinical assay.
            </p>
          </section>

          <section className="border-t border-line py-6">
            <h2 className="text-[18px] font-semibold text-ink">Scope of this build</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              The current site does not read human scRNA files, run model
              inference, generate methylation atlases, or operate a production
              cell database. It runs entirely on synthetic demo records and
              exposes the planned API contract with runtime validation and
              explicit demo flags.
            </p>
          </section>

          <section id="data-policies" className="scroll-mt-24 border-t border-line py-6">
            <h2 className="text-[18px] font-semibold text-ink">Data policies</h2>
            <ul className="mt-2 grid gap-2 text-[13px] leading-relaxed text-ink-soft">
              <li>No real donor identifiers, raw expression matrices, or restricted files are served.</li>
              <li>No dataset is marked public until audit-reviewed licence and provenance metadata exist.</li>
              <li>Production counts remain null until independently audited; file-level records are not independent cells.</li>
              <li>Prediction values retain a provenance identifier that links model, checkpoint, input, and audit state.</li>
              <li>Uploads, accounts, and user-triggered GPU inference are out of scope for Phase 0.</li>
            </ul>
          </section>

          <section id="citations" className="scroll-mt-24 border-t border-line py-6">
            <h2 className="text-[18px] font-semibold text-ink">Source &amp; citations</h2>
            <div className="mt-2 border border-line bg-paper-tint px-3 py-2.5 text-[12px] leading-relaxed text-ink-soft">
              <p className="font-medium text-ink">Citation placeholder</p>
              <p className="mt-1">
                No DOI, journal, author list, or publication status is asserted
                here. A real citation block must be supplied from a verified
                manuscript record before release. Method references for CPGMoE,
                450K panel design, and single-cell RNA processing are likewise
                withheld until verified.
              </p>
            </div>
          </section>

          <section className="border-t border-line py-6">
            <h2 className="text-[18px] font-semibold text-ink">Contact</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              The footer contact entry is a placeholder. No real postal address,
              institutional affiliation, or monitored email is fabricated on
              this site.
            </p>
          </section>
        </div>

        <aside className="content-start">
          <div className="panel p-4">
            <p className="micro-label">At a glance</p>
            <dl className="mt-2 divide-y divide-line text-[12px]">
              {[
                ["Primary model", "Full-S3 CPGMoE"],
                ["Training domain", "TCGA bulk multi-omics"],
                ["Target space", "Illumina 450K panel"],
                ["Genome build", "GRCh38 / hg38"],
                ["Data mode", "Synthetic demo"],
                ["Audit state", "In progress"],
              ].map(([label, value]) => (
                <div key={label} className="py-2">
                  <dt className="text-[10px] uppercase text-ink-faint">{label}</dt>
                  <dd className="mt-0.5 font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="panel mt-3 p-4 text-[12px] leading-relaxed text-ink-soft">
            <p className="font-medium text-ink">Read next</p>
            <ul className="mt-2 grid gap-1.5">
              <li><Link className="link-quiet" href="/methods">Methods &amp; limitations</Link></li>
              <li><Link className="link-quiet" href="/downloads">Downloads &amp; API</Link></li>
              <li><Link className="link-quiet" href="/datasets">Synthetic datasets</Link></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
