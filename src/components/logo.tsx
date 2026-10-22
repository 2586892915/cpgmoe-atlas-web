export function Logo({
  compact = false,
  theme = "light",
}: {
  compact?: boolean;
  theme?: "light" | "dark";
}) {
  const dark = theme === "dark";
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        viewBox="0 0 32 32"
        className="h-7 w-7 shrink-0"
        role="img"
        aria-label="CPGMoE Atlas mark"
      >
        <path
          d="M10 3.5c7.5 4.2 7.5 8.7 0 12.5s-7.5 8.3 0 12.5"
          fill="none"
          stroke={dark ? "#4FD1C5" : "#156E86"}
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="M22 3.5c-7.5 4.2-7.5 8.7 0 12.5s7.5 8.3 0 12.5"
          fill="none"
          stroke={dark ? "#7DD3FC" : "#5065A8"}
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <circle cx="16" cy="10.2" r="1.9" fill={dark ? "#F6AD55" : "#158F80"} />
        <circle cx="16" cy="21.8" r="1.9" fill={dark ? "#F6AD55" : "#158F80"} />
        <circle cx="11.2" cy="16" r="1.35" fill={dark ? "#4FD1C5" : "#156E86"} />
        <circle cx="20.8" cy="16" r="1.35" fill={dark ? "#7DD3FC" : "#5065A8"} />
      </svg>
      {!compact ? (
        <span
          className={`text-[15px] font-semibold leading-none ${
            dark ? "text-[#E6F1FF]" : "text-ink"
          }`}
        >
          CPGMoE{" "}
          <span className={dark ? "font-normal text-[#94A3B8]" : "font-normal text-ink-soft"}>
            Atlas
          </span>
        </span>
      ) : null}
    </span>
  );
}
