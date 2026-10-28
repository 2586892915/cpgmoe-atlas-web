import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Tissues",
};

export default async function GroupsIndex({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; organ_system?: string }>;
}) {
  const { q, organ_system: organ } = await searchParams;
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (organ) params.set("organ", organ);
  const query = params.toString();
  redirect(query ? `/tissues?${query}` : "/tissues");
}
