import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DemoBanner } from "@/components/demo-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: {
    default: "CPGMoE Atlas — predicted single-cell DNA methylation",
    template: "%s · CPGMoE Atlas",
  },
  description:
    "A searchable atlas of predicted, panel-based single-cell DNA methylation inferred from RNA expression by Full-S3 CPGMoE. Phase 0 synthetic demo.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#156E86",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-primary"
        >
          Skip to content
        </a>
        <SiteHeader />
        <div className="pt-14">
          <DemoBanner />
          <main id="main">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
