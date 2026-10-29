import { pilotError, pilotResponse } from "@/lib/api";
import { FULL_LEVELS } from "@/lib/full-profiles";
import {
  cpgGroupValues,
  getCpg,
  getCpgStats,
  pilotEnvelope,
  topGroupsForCpg,
} from "@/lib/pilot";
import { getProbe } from "@/lib/probes";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const cpg = getCpg(id);

  if (cpg) {
    const stats = getCpgStats(id);
    const values = cpgGroupValues(id);
    return pilotResponse({
      ...pilotEnvelope(),
      full_levels: FULL_LEVELS,
      cpg,
      stats,
      group_level_available: true,
      n_groups: values.length,
      high_confidence_groups: values.filter((value) => value.group.high_confidence).length,
      top_groups: topGroupsForCpg(id, 15),
      coverage_note: null,
    });
  }

  const probe = getProbe(id);
  if (!probe) {
    return pilotError("cpg_not_found", "Unknown probe id.", 404);
  }

  return pilotResponse({
    ...pilotEnvelope(),
    full_levels: FULL_LEVELS,
    cpg: {
      cpg_id: probe.probe_id,
      panel_slot: null,
      chr: probe.chr,
      pos: probe.pos,
      genome_build: "GRCh38",
      panel_index: null,
      context: null,
      island_relation: probe.island,
      island_locus: null,
      promoter: probe.promoter,
      genes: probe.genes,
      gene_groups: null,
      total_variance: probe.total_variance,
    },
    probe: {
      global_mean_beta: probe.global_mean_beta,
      total_variance: probe.total_variance,
      celltype_variance_fraction: probe.celltype_variance_fraction,
    },
    stats: null,
    group_level_available: false,
    n_groups: 0,
    high_confidence_groups: 0,
    top_groups: [],
    coverage_note:
      "Full-panel predicted β is available by cell type, tissue and organ; tissue × cell-type values exist for the 512-CpG slice only.",
  });
}
