"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/layout/Logo";
import { useApp } from "@/context/AppProvider";
import type { Library } from "@/lib/libraryTypes";

const homeLink = { href: "/dashboard", label: "Dashboard" };

function linkClass(active: boolean) {
  return active
    ? "flex items-center gap-3 rounded-xl bg-background px-3 py-2.5 text-sm font-medium text-foreground shadow-sm"
    : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-background hover:text-foreground";
}

export default function SideNav({
  brand,
  libraries = [],
}: {
  brand: { name: string; logo: string };
  libraries?: Library[];
}) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useApp();
  const homeActive = pathname === homeLink.href;

  return (
    <>
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-72 shrink-0 flex-col border-r border-border bg-surface transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-border px-4">
          <Link href="/" onClick={() => setSidebarOpen(false)}>
            <Logo name={brand.name} logo={brand.logo} />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          <Link
            href={homeLink.href}
            className={linkClass(homeActive)}
            aria-current={homeActive ? "page" : undefined}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            {homeLink.label}
          </Link>
          <Link
            href="/dashboard/interview"
            className={linkClass(pathname === "/dashboard/interview")}
            aria-current={pathname === "/dashboard/interview" ? "page" : undefined}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#7c3aed]" />
            Interview
          </Link>
          <p className="px-3 pb-1 pt-4 text-xs font-medium uppercase tracking-wide text-muted">
            Libraries
          </p>
          {libraries
            .filter((library) => library.slug !== "interview")
            .map((library) => {
            const href = `/dashboard/${library.slug}`;
            const active = pathname === href;
            return (
              <Link
                key={library.id}
                href={href}
                className={linkClass(active)}
                aria-current={active ? "page" : undefined}
                onClick={() => setSidebarOpen(false)}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: library.accent }}
                />
                {library.title}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-border p-3">
          <Link
            href="/dashboard/settings"
            className={linkClass(pathname === "/dashboard/settings")}
            aria-current={pathname === "/dashboard/settings" ? "page" : undefined}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-foreground" />
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
}
