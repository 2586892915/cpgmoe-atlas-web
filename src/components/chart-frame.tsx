"use client";

import { AlertTriangle, BarChart3, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export type VizState = "demo" | "loading" | "empty" | "error";

const STATE_OPTIONS: Array<{ value: VizState; label: string }> = [
  { value: "demo", label: "Live demo" },
  { value: "loading", label: "Loading" },
  { value: "empty", label: "Empty" },
  { value: "error", label: "Error" },
];

export function useVizState(initial: VizState = "demo") {
  const [state, setState] = useState<VizState>(initial);
  return { state, setState };
}

export function VizStateSelect({
  value,
  onChange,
}: {
  value: VizState;
  onChange: (next: VizState) => void;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-[11px] text-ink-faint">
      <span className="hidden sm:inline">State</span>
      <select
        aria-label="Preview chart state"
        value={value}
        onChange={(event) => onChange(event.target.value as VizState)}
        className="h-7 border border-line bg-white px-1.5 text-[11px] text-ink-soft focus:border-primary focus:outline-none"
        style={{ borderRadius: 3 }}
      >
        {STATE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function LoadingState() {
  return (
    <div
      className="flex min-h-[240px] flex-col justify-between gap-4 p-4"
      aria-label="Chart loading"
      role="status"
    >
      <div className="flex flex-1 items-end gap-3 pt-2">
        {[42, 68, 54, 77, 61, 84, 49, 72, 58, 66].map((height, index) => (
          <div
            key={index}
            className="skeleton flex-1"
            style={{ height: `${height * 1.8}px`, borderRadius: 2 }}
          />
        ))}
      </div>
      <div className="skeleton h-3 w-40" />
    </div>
  );
}

function EmptyState({ message }: { message?: string }) {
  return (
    <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 p-6 text-center">
      <BarChart3 className="h-6 w-6 text-ink-faint" aria-hidden="true" />
      <p className="text-sm font-medium text-ink">No data to display</p>
      <p className="max-w-sm text-[12px] text-ink-faint">
        {message ?? "No synthetic records match the current filters."}
      </p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 p-6 text-center"
      role="alert"
    >
      <AlertTriangle className="h-6 w-6 text-warm" aria-hidden="true" />
      <p className="text-sm font-medium text-ink">Preview failed to render</p>
      <p className="max-w-sm text-[12px] text-ink-faint">
        This is a demonstration error state. No model or data service was called.
      </p>
      <button type="button" className="btn btn-secondary mt-1 h-8" onClick={onRetry}>
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Retry preview
      </button>
    </div>
  );
}

export function ChartFrame({
  title,
  eyebrow,
  description,
  state,
  onStateChange,
  actions,
  legend,
  footer,
  children,
  bodyClassName = "min-h-[300px]",
  emptyMessage,
}: {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  state: VizState;
  onStateChange?: (next: VizState) => void;
  actions?: ReactNode;
  legend?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
  emptyMessage?: string;
}) {
  return (
    <section className="panel overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          {eyebrow ? <p className="eyebrow mb-0.5">{eyebrow}</p> : null}
          <h3 className="text-[15px] font-semibold leading-snug text-ink">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-ink-faint">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {state === "demo" ? (
            <Badge tone="primary" dot>
              Synthetic demo
            </Badge>
          ) : state === "loading" ? (
            <Badge tone="neutral" dot>
              Loading preview
            </Badge>
          ) : state === "empty" ? (
            <Badge tone="neutral" dot>
              Empty preview
            </Badge>
          ) : (
            <Badge tone="warm" dot>
              Error preview
            </Badge>
          )}
          {onStateChange ? (
            <VizStateSelect value={state} onChange={onStateChange} />
          ) : null}
          {actions}
        </div>
      </header>
      <div className={bodyClassName}>
        {state === "loading" ? <LoadingState /> : null}
        {state === "empty" ? <EmptyState message={emptyMessage} /> : null}
        {state === "error" ? (
          <ErrorState onRetry={() => onStateChange?.("demo")} />
        ) : null}
        {state === "demo" ? <div className="h-full animate-fadein">{children}</div> : null}
      </div>
      {legend && state === "demo" ? (
        <div className="border-t border-line bg-paper-tint/60 px-4 py-2.5">{legend}</div>
      ) : null}
      {footer ? (
        <div className="border-t border-line px-4 py-2.5 text-[11px] leading-relaxed text-ink-faint">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
