import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell py-20">
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-2 text-[28px] font-semibold text-ink">
          This record is not in the demo catalogue
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          The page may not exist, or the dataset identifier may not be part of
          the synthetic demonstration set.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link className="btn btn-primary" href="/">
            Return home
          </Link>
          <Link className="btn btn-secondary" href="/datasets">
            Browse datasets
          </Link>
        </div>
      </div>
    </div>
  );
}
