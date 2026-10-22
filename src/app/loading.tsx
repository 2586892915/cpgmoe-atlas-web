export default function Loading() {
  return (
    <div className="shell py-10" role="status" aria-live="polite">
      <div className="skeleton h-4 w-28" />
      <div className="skeleton mt-3 h-8 w-80 max-w-full" />
      <div className="skeleton mt-3 h-4 w-full max-w-2xl" />
      <div className="skeleton mt-2 h-4 w-full max-w-xl" />
      <div className="skeleton mt-8 h-56 w-full" />
      <span className="sr-only">Loading page</span>
    </div>
  );
}
