"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppProvider";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const { user, ready, sidebarOpen, toggleSidebar, logout } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login");
    }
  }, [ready, user, router]);

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex flex-col justify-center gap-1 md:hidden"
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
            onClick={toggleSidebar}
          >
            <span className="block h-0.5 w-5 bg-foreground" />
            <span className="block h-0.5 w-5 bg-foreground" />
            <span className="block h-0.5 w-5 bg-foreground" />
          </button>
          <span className="text-sm font-medium">Lessons</span>
        </div>
        {user ? (
          <div className="flex min-w-0 items-center gap-3">
            <p className="hidden truncate text-sm text-muted sm:block">
              {user.email}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface"
            >
              Log out
            </button>
          </div>
        ) : null}
      </header>
      {!ready || !user ? (
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted">
          Loading...
        </div>
      ) : (
        <div className="flex-1 p-4 md:p-6">{children}</div>
      )}
    </div>
  );
}
