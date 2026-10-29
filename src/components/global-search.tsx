"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { parseSearchQuery } from "@/lib/coordinate-utils";
import { IS_PILOT } from "@/lib/data-mode";
import { Badge } from "@/components/ui/badge";

const EXAMPLES = IS_PILOT
  ? [
      { label: "PTPRN2", value: "PTPRN2" },
      { label: "cg26173773", value: "cg26173773" },
      { label: "chrX:90,689,602-90,690,119", value: "chrX:90689602-90690119" },
    ]
  : [
      { label: "TP53", value: "TP53" },
      { label: "cg00000029", value: "cg00000029" },
      { label: "chr17:7,668,001-7,690,000", value: "chr17:7,668,001-7,690,000" },
    ];

export function GlobalSearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const parsed = useMemo(() => parseSearchQuery(value), [value]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = value.trim();
    if (!query) {
      setError("Enter a gene symbol, CpG probe ID, or GRCh38 region.");
      return;
    }
    setError(null);
    router.push(`/browser?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="mt-6 max-w-3xl">
      <form onSubmit={submit} role="search" aria-label="Search the atlas">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="atlas-search" className="sr-only">
            Gene, CpG probe, or GRCh38 region
          </label>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
              aria-hidden="true"
            />
            <input
              id="atlas-search"
              name="q"
              autoFocus={autoFocus}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setError(null);
              }}
              placeholder="Gene, CpG probe, or GRCh38 region"
              className={`field h-11 pl-9 text-[14px] ${
                value.trim() ? "pr-24" : "pr-3"
              }`}
              autoComplete="off"
              aria-describedby="atlas-search-hint"
              aria-invalid={Boolean(error)}
            />
            {value.trim() ? (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <Badge tone="muted">
                  {parsed.kind === "gene"
                    ? "Gene"
                    : parsed.kind === "probe"
                      ? "Probe"
                      : parsed.kind === "region"
                        ? "Region"
                        : "Query"}
                </Badge>
              </span>
            ) : null}
          </div>
          <button type="submit" className="btn btn-primary h-11 px-5">
            Search atlas
          </button>
        </div>
      </form>
      <div
        id="atlas-search-hint"
        className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-faint"
      >
        <span>Try</span>
        {EXAMPLES.map((example, index) => (
          <span key={example.value} className="inline-flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">·</span> : null}
            <button
              type="button"
              className="mono text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
              onClick={() => {
                setValue(example.value);
                setError(null);
              }}
            >
              {example.label}
            </button>
          </span>
        ))}
        <span className="w-full text-[11px] text-ink-faint sm:ml-1 sm:w-auto">
          <span aria-hidden="true" className="mr-1.5 text-line-strong">
            |
          </span>
          GRCh38/hg38 · {IS_PILOT ? "485,403 probes" : "demo records only"}
        </span>
      </div>
      {error ? (
        <p className="mt-1.5 text-[12px] text-warm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
