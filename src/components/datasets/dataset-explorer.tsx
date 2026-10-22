"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import type { DatasetDetail } from "@/lib/schemas";

type SortKey =
  | "title"
  | "tissue"
  | "disease"
  | "assay"
  | "n_cells"
  | "n_donors"
  | "prediction"
  | "evidence";

const PAGE_SIZE = 7;

const EVIDENCE_TONE: Record<string, "primary" | "neutral" | "warm" | "muted"> = {
  A: "primary",
  B: "neutral",
  C: "warm",
  unverified: "muted",
};

function predictionStatus(dataset: DatasetDetail): string {
  if (dataset.stages.excluded) return "Excluded";
  if (dataset.stages.predicted) return "Predicted";
  if (dataset.status === "metadata_only") return "Pending RNA QC";
  if (dataset.stages.encoded) return "Encoded · not predicted";
  return "Not run";
}

function FilterMenu({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  };

  return (
    <details className="group relative">
      <summary className="btn btn-secondary cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
        {selected.length ? <Badge tone="primary">{selected.length}</Badge> : null}
        <ChevronDown className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
      </summary>
      <div
        className="absolute left-0 top-full z-30 mt-1 w-64 border border-line bg-white p-2 shadow-float"
        style={{ borderRadius: 4 }}
      >
        <div className="max-h-60 overflow-auto">
          {options.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-[12px] text-ink-soft hover:bg-paper-tint"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggle(option)}
                className="h-3.5 w-3.5 accent-[#156E86]"
              />
              {option}
            </label>
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-line pt-1.5">
          <span className="px-2 text-[11px] text-ink-faint">{selected.length} selected</span>
          <button
            type="button"
            className="btn btn-quiet h-7 px-2 text-[11px]"
            onClick={() => onChange([])}
            disabled={selected.length === 0}
          >
            Clear
          </button>
        </div>
      </div>
    </details>
  );
}

export function DatasetExplorer({
  datasets,
  tissues,
  diseases,
  assays,
}: {
  datasets: DatasetDetail[];
  tissues: string[];
  diseases: string[];
  assays: string[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [tissueFilter, setTissueFilter] = useState<string[]>([]);
  const [diseaseFilter, setDiseaseFilter] = useState<string[]>([]);
  const [assayFilter, setAssayFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const resetPage = () => setPage(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return datasets.filter((dataset) => {
      if (query) {
        const haystack = [
          dataset.dataset_id,
          dataset.title,
          dataset.tissue,
          dataset.disease,
          dataset.assay,
          dataset.cell_types.join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (tissueFilter.length && !tissueFilter.includes(dataset.tissue ?? "")) {
        return false;
      }
      if (diseaseFilter.length && !diseaseFilter.includes(dataset.disease ?? "")) {
        return false;
      }
      if (assayFilter.length && !assayFilter.includes(dataset.assay ?? "")) {
        return false;
      }
      return true;
    });
  }, [datasets, search, tissueFilter, diseaseFilter, assayFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case "n_cells":
          comparison = (a.n_cells ?? -1) - (b.n_cells ?? -1);
          break;
        case "n_donors":
          comparison = (a.n_donors ?? -1) - (b.n_donors ?? -1);
          break;
        case "prediction":
          comparison = predictionStatus(a).localeCompare(predictionStatus(b));
          break;
        case "evidence":
          comparison = (a.evidence_tier ?? "unverified").localeCompare(
            b.evidence_tier ?? "unverified",
          );
          break;
        default:
          comparison = String(a[sortKey] ?? "").localeCompare(
            String(b[sortKey] ?? ""),
          );
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return list;
  }, [filtered, sortKey, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters =
    search.trim().length > 0 ||
    tissueFilter.length > 0 ||
    diseaseFilter.length > 0 ||
    assayFilter.length > 0;

  const setSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
    resetPage();
  };

  const SortHeader = ({ label, column }: { label: string; column: SortKey }) => (
    <th scope="col" aria-sort={sortKey === column ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-left hover:text-primary"
        onClick={() => setSort(column)}
      >
        {label}
        {sortKey === column ? (
          sortDirection === "asc" ? (
            <ArrowUp className="h-3 w-3" aria-hidden="true" />
          ) : (
            <ArrowDown className="h-3 w-3" aria-hidden="true" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" aria-hidden="true" />
        )}
      </button>
    </th>
  );

  return (
    <div>
      <div className="flex flex-col gap-3 border-y border-line bg-paper-tint px-4 py-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="dataset-search" className="sr-only">
            Search datasets
          </label>
          <input
            id="dataset-search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetPage();
            }}
            placeholder="Search title, ID, tissue, disease, cell type"
            className="field h-9 pr-8"
          />
          {search ? (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-ink-faint hover:text-ink"
              onClick={() => {
                setSearch("");
                resetPage();
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterMenu
            label="Tissue"
            options={tissues}
            selected={tissueFilter}
            onChange={(next) => {
              setTissueFilter(next);
              resetPage();
            }}
          />
          <FilterMenu
            label="Disease"
            options={diseases}
            selected={diseaseFilter}
            onChange={(next) => {
              setDiseaseFilter(next);
              resetPage();
            }}
          />
          <FilterMenu
            label="Assay"
            options={assays}
            selected={assayFilter}
            onChange={(next) => {
              setAssayFilter(next);
              resetPage();
            }}
          />
          {hasFilters ? (
            <button
              type="button"
              className="btn btn-quiet h-9 text-[12px]"
              onClick={() => {
                setSearch("");
                setTissueFilter([]);
                setDiseaseFilter([]);
                setAssayFilter([]);
                resetPage();
              }}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Reset
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2 text-[11px] text-ink-faint">
        <span>
          {sorted.length === 0
            ? "0 synthetic datasets"
            : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(
                safePage * PAGE_SIZE,
                sorted.length,
              )} of ${sorted.length} synthetic datasets`}
        </span>
        <span className="flex items-center gap-2">
          <Badge tone="primary" dot>
            Synthetic demo
          </Badge>
          Cell counts are illustrative placeholders
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table min-w-[980px]">
          <caption className="sr-only">
            Synthetic demo datasets. Rows can be sorted and opened for details.
          </caption>
          <thead>
            <tr>
              <SortHeader label="Dataset" column="title" />
              <SortHeader label="Tissue" column="tissue" />
              <SortHeader label="Disease" column="disease" />
              <SortHeader label="Assay" column="assay" />
              <SortHeader label="Cells" column="n_cells" />
              <SortHeader label="Donors" column="n_donors" />
              <SortHeader label="Prediction" column="prediction" />
              <SortHeader label="Evidence" column="evidence" />
              <th scope="col">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <p className="text-sm font-medium text-ink">No datasets match these filters</p>
                  <p className="mt-1 text-[12px] text-ink-faint">
                    Clear the search or filters to see the synthetic catalogue.
                  </p>
                </td>
              </tr>
            ) : (
              visible.map((dataset) => {
                const href = `/datasets/${dataset.dataset_id}`;
                return (
                  <tr
                    key={dataset.dataset_id}
                    className="cursor-pointer"
                    tabIndex={0}
                    role="link"
                    aria-label={`Open dataset ${dataset.dataset_id}`}
                    onClick={(event) => {
                      if ((event.target as HTMLElement).closest("a")) return;
                      router.push(href);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(href);
                      }
                    }}
                  >
                    <td className="max-w-[260px]">
                      <Link href={href} className="block">
                        <span className="block text-[13px] font-medium text-ink hover:text-primary">
                          {dataset.title}
                        </span>
                        <span className="mono mt-0.5 block text-[10px] text-ink-faint">
                          {dataset.dataset_id}
                        </span>
                      </Link>
                    </td>
                    <td>{dataset.tissue}</td>
                    <td className="max-w-[170px]">{dataset.disease}</td>
                    <td className="max-w-[170px] text-[12px]">{dataset.assay}</td>
                    <td className="tabular text-right">
                      ≈{dataset.n_cells?.toLocaleString("en-US")}
                      <span className="text-ink-faint">*</span>
                    </td>
                    <td className="tabular text-right">{dataset.n_donors}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5">
                        <StatusBadge status={dataset.status} />
                      </span>
                      <span className="mt-0.5 block text-[10px] text-ink-faint">
                        {predictionStatus(dataset)}
                      </span>
                    </td>
                    <td>
                      <Badge tone={EVIDENCE_TONE[dataset.evidence_tier ?? "unverified"]}>
                        {dataset.evidence_tier ?? "unverified"}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <ArrowRight className="ml-auto h-4 w-4 text-ink-faint" aria-hidden="true" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
        <p className="text-[11px] text-ink-faint">
          * Illustrative placeholder. Not an audited or predicted cell count.
          <span className="ml-1 sm:hidden">Swipe horizontally for all columns.</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-secondary h-8 px-2"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={safePage <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="tabular text-[12px] text-ink-soft">
            Page {safePage} of {pageCount}
          </span>
          <button
            type="button"
            className="btn btn-secondary h-8 px-2"
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            disabled={safePage >= pageCount}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
