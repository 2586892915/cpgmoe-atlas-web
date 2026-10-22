import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#17262E",
          soft: "#3D535D",
          faint: "#6B7F88",
        },
        paper: {
          DEFAULT: "#FCFDFD",
          tint: "#F4F8F9",
          deep: "#EAF1F3",
        },
        line: {
          DEFAULT: "#D7E2E5",
          strong: "#B9C9CE",
        },
        primary: {
          DEFAULT: "#156E86",
          dark: "#0E5366",
          light: "#3E93A8",
          wash: "#E8F2F4",
        },
        rna: {
          DEFAULT: "#158F80",
          wash: "#E5F3F0",
        },
        dna: {
          DEFAULT: "#5065A8",
          wash: "#EAEDF7",
        },
        warm: {
          DEFAULT: "#A36A1F",
          wash: "#FCF4E6",
        },
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Arial", "Helvetica", "sans-serif"],
        mono: ["Cascadia Mono", "Consolas", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "2xs": ["11px", "16px"],
      },
      maxWidth: {
        shell: "1360px",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(23, 38, 46, 0.04)",
        float: "0 12px 32px rgba(23, 38, 46, 0.14)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-420px 0" },
          "100%": { backgroundPosition: "420px 0" },
        },
        fadein: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.35s linear infinite",
        fadein: "fadein 180ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
