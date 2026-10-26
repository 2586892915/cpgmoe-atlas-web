import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { IS_PILOT } from "@/lib/data-mode";
import { pilotRelease } from "@/lib/pilot";

export const metadata: Metadata = {
  title: "Methods & limitations",
  description:
    "Methods, inference semantics, coordinate conventions, and evaluation boundaries for the CPGMoE Atlas prototype.",
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line py-6 first:border-t-0 first:pt-0">
      <h2 className="text-[18px] font-semibold text-ink">{title}</h2>
      <div className="mt-2 grid gap-3 text-[13px] leading-relaxed text-ink-soft">
        {children}
      </div>
    </section>
  );
}

export default function MethodsPage() {
  return (
    <div className="shell py-8">
      <div className="max-w-4xl">
        <h1 className="text-[28px] font-semibold leading-tight text-ink">
          Methods &amp; limitations
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          What this prototype does, what it does not do, and what changes when
          audited data arrives.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="primary" dot>{IS_PILOT ? "Pilot release" : "Phase 0"}</Badge>
          <Badge tone="warm" dot>Research use only</Badge>
          <Badge tone="neutral">GRCh38 / hg38</Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-24 border-l border-line pl-4">
            <p className="micro-label mb-2">On this page</p>
            <ul className="grid gap-1.5 text-[12px] text-ink-soft">
              {[
                ["data-status", "Data status"],
                ["model", "Model"],
                ["semantics", "Prediction semantics"],
                ["boundaries", "Evaluation boundaries"],
                ["coordinates", "Coordinate convention"],
                ["lifecycle", "Data lifecycle"],
                ["privacy", "Privacy & governance"],
                ["versioning", "Versioning"],
              ].map(([id, label]) => (
                <li key={id}>
                  <a className="hover:text-primary" href={`#${id}`}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="max-w-3xl">
          <Section id="data-status" title="Data status">
            {IS_PILOT ? (
              <>
                <p>
                  This deployment serves the 3M-cell Full-S3 pilot:
                  {" "}
                  {pilotRelease.n_cells_in_groups.toLocaleString("en-US")} cells
                  across {pilotRelease.n_groups.toLocaleString("en-US")}{" "}
                  tissue × cell-type groups, with{" "}
                  {pilotRelease.n_profiled_cpgs} high-variance panel CpGs.
                </p>
                <dl className="panel divide-y divide-line text-[12px]">
                  {[
                    ["Release", pilotRelease.release_id],
                    ["Aggregation", pilotRelease.aggregation],
                    ["Checkpoint", pilotRelease.checkpoint.sha256],
                    ["Panel", `${pilotRelease.n_profiled_cpgs} / ${pilotRelease.n_panel_probes.toLocaleString("en-US")} CpGs`],
                    ["Groups", `${pilotRelease.n_groups} (${pilotRelease.n_groups_high_confidence} high-confidence)`],
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[130px_1fr] gap-3 px-3 py-2">
                      <dt className="text-ink-faint">{label}</dt>
                      <dd className="mono break-all text-ink-soft">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="border border-warm/25 bg-warm-wash px-3 py-2 text-[12px] text-warm">
                  {pilotRelease.caveat}
                </div>
                <p>
                  Per-cell predictions, raw RNA and donor-level rows are not
                  served by this website. Groups with fewer than three donors or
                  two studies are marked exploratory.
                </p>
              </>
            ) : (
              <>
            <p>
              The human scRNA audit is in progress. Production cell counts and
              eligibility rates are withheld until the audit produces
              file-level, dataset-level, and deduplicated evidence. A dash on
              the portal means “not established”, not zero.
            </p>
            <div className="border border-warm/25 bg-warm-wash px-3 py-2 text-[12px] text-warm">
              Phase 0 serves only synthetic demonstration records. No human
              scRNA file is read by this website, and no count of 100M+ cells is
              claimed as an atlas achievement.
            </div>
            <p>
              The number of demo datasets on the site is a UI fixture, not a
              report of audited collection size.
            </p>
              </>
            )}
          </Section>

          <Section id="model" title="Model">
            <p>
              CPGMoE is the primary model family. It is trained on bulk
              multi-omics data and predicts DNA methylation for a specified
              Illumina 450K panel CpG space. The portal uses the term{" "}
              <em>predicted DNA methylation</em> throughout; it does not imply
              experimental measurement.
            </p>
            <dl className="panel divide-y divide-line text-[12px]">
              {[
                ["Input", "Human single-cell RNA expression (GRCh38-aligned)"],
                ["Target", "450K panel CpG beta values"],
                ["Training domain", "TCGA bulk multi-omics"],
                ["Output", "Predicted beta in [0, 1]"],
                [
                  "Checkpoint",
                  IS_PILOT
                    ? `Full-S3 ${pilotRelease.checkpoint.sha256.slice(0, 16)}… (offline)`
                    : "Not loaded in Phase 0; hash is null",
                ],
                [
                  "Inference",
                  IS_PILOT
                    ? "Not executed by this website; aggregates are consumed as-is"
                    : "Not executed by this website",
                ],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[130px_1fr] gap-3 px-3 py-2">
                  <dt className="text-ink-faint">{label}</dt>
                  <dd className="text-ink-soft">{value}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="semantics" title="Prediction semantics">
            <p>
              A value returned by the intended prediction service is a beta-like
              model estimate for a named CpG in a named cell or group. It is not
              a bisulfite-sequencing readout, not a measured single-cell DNA
              methylation value, and not a clinical biomarker.
            </p>
            <p>
              Group summaries are means of cell-level predictions. They retain
              the number of aggregated cells and a provenance identifier. A
              later release must additionally expose checkpoint hash, input
              dataset version, and the audit record that authorised use.
            </p>
          </Section>

          <Section id="boundaries" title="Evaluation boundaries">
            <ul className="grid gap-2">
              <li>
                The prototype does not claim genome-wide superiority or
                validated performance on unseen CpGs.
              </li>
              <li>
                Bulk-to-single-cell domain transfer is a known limitation, not a
                solved property.
              </li>
              <li>
                The panel target space is narrower than the genome; predictions
                outside the panel are out of scope.
              </li>
              <li>
                No p-values, FDR, differential methylation regions, or causal
                claims are generated in demo mode.
              </li>
              <li>
                Production performance must be reported with an explicit
                evaluation protocol and held-out evidence.
              </li>
            </ul>
          </Section>

          <Section id="coordinates" title="Coordinate convention">
            <p>
              Genomic intervals are stored internally as 0-based half-open
              ranges <span className="mono">[start, end)</span> and rendered in
              the interface as 1-based inclusive ranges. All conversions go
              through one utility module to prevent off-by-one drift.
            </p>
            <div className="panel overflow-x-auto">
              <table className="data-table min-w-[520px]">
                <thead>
                  <tr>
                    <th scope="col">Layer</th>
                    <th scope="col">Convention</th>
                    <th scope="col">Example</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Storage / API internals</td>
                    <td>0-based half-open</td>
                    <td className="mono text-[11px]">[7668400, 7668402)</td>
                  </tr>
                  <tr>
                    <td>UI labels</td>
                    <td>1-based inclusive</td>
                    <td className="mono text-[11px]">chr17:7,668,401-7,668,402</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="lifecycle" title="Data lifecycle">
            <p>
              The portal exposes five explicit stages. A stage is a claim about
              pipeline state, not a quality score.
            </p>
            <ol className="grid gap-2">
              <li><span className="font-medium text-ink">Indexed</span> — file inventory and metadata registered.</li>
              <li><span className="font-medium text-ink">RNA-QC passed</span> — predefined QC thresholds met.</li>
              <li><span className="font-medium text-ink">Encoded</span> — a latent representation exists for eligible cells.</li>
              <li><span className="font-medium text-ink">Predicted</span> — CPGMoE output exists with provenance.</li>
              <li><span className="font-medium text-ink">Excluded</span> — blocked by licence, consent, or eligibility.</li>
            </ol>
          </Section>

          <Section id="privacy" title="Privacy & governance">
            <p>
              No donor identifier, raw expression profile, or restricted source
              file is served by this prototype. Public release of any real data
              requires audit-reviewed licence, provenance, and consent handling.
              The Contact entry in the footer is a placeholder, not a monitored
              address.
            </p>
          </Section>

          <Section id="versioning" title="Versioning">
            <p>
              The API contract is versioned at <span className="mono">/api/v1</span>.
              A real data provider must be introduced explicitly and validated
              against <span className="mono">lib/schemas.ts</span>; flipping a
              synthetic flag is not an acceptable migration path.
            </p>
            <p>
              See the repository documents{" "}
              <span className="mono">docs/API_CONTRACT.md</span>,{" "}
              <span className="mono">docs/DATA_STATE_MODEL.md</span>, and{" "}
              <span className="mono">docs/INTEGRATION_PLAN.md</span> for the full
              contract.
            </p>
          </Section>

          <div className="mt-6 border-t border-line pt-4 text-[12px] text-ink-faint">
            <Link className="link-quiet" href="/about">
              About the atlas and data policies
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
