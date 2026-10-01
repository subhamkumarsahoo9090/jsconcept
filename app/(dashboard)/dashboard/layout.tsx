import type { ReactNode } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import PageChrome from "@/components/layout/PageChrome";
import SideNav from "@/components/layout/SideNav";
import { pageChrome, projectManager } from "@/config/projectmanager";
import { readLibraries } from "@/lib/libraryStore";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const libraries = await readLibraries();
  const brand = {
    name: projectManager.app.name,
    logo: projectManager.app.logo,
  };

  return (
    <PageChrome
      pages={pageChrome()}
      topNav={<Navbar brand={brand} />}
      sidebar={<SideNav brand={brand} libraries={libraries} />}
      footer={<Footer />}
    >
      <DashboardShell>{children}</DashboardShell>
    </PageChrome>
  );
}
