import type { Metadata } from "next";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import { pageMetadata } from "@/config/projectmanager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata("/dashboard/settings");

export default function SettingsPage() {
  return <SettingsPanel />;
}
