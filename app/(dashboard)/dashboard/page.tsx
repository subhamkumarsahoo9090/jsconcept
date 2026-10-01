import type { Metadata } from "next";
import DashboardHome from "@/components/dashboard/DashboardHome";
import { pageMetadata } from "@/config/projectmanager";
import { readLibraries } from "@/lib/libraryStore";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata("/dashboard");

export default async function DashboardPage() {
  const libraries = await readLibraries();
  return <DashboardHome libraries={libraries} />;
}
