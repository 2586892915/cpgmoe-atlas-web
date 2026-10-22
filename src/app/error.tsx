"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="shell py-20">
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow">Route error</p>
        <h1 className="mt-2 text-[26px] font-semibold text-ink">
          Something failed to render
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          This is a local demo route. No model or remote data service is
          involved. You can retry the route or return to the catalogue.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" className="btn btn-primary" onClick={reset}>
            Retry route
          </button>
          <Link className="btn btn-secondary" href="/">
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
