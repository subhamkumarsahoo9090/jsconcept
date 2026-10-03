"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DeleteLibraryButton from "@/components/dashboard/DeleteLibraryButton";
import { useApp } from "@/context/AppProvider";

type LibraryBar = {
  id: string;
  title: string;
  summary: string;
  accent: string;
  slug: string;
  editing: boolean;
  onToggleEdit: () => void;
};

const LibraryBarContext = createContext<(bar: LibraryBar | null) => void>(() => undefined);

export function useLibraryBar(bar: LibraryBar | null) {
  const setBar = useContext(LibraryBarContext);
  useEffect(() => {
    setBar(bar);
    return () => setBar(null);
  }, [bar, setBar]);
}

export default function DashboardShell({ children }: { children: ReactNode }) {
  const { user, ready, sidebarOpen, toggleSidebar, logout } = useApp();
  const router = useRouter();
  const [libraryBar, setLibraryBar] = useState<LibraryBar | null>(null);

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
    <LibraryBarContext.Provider value={setLibraryBar}>
      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              className="inline-flex shrink-0 flex-col justify-center gap-1 md:hidden"
              aria-label="Open menu"
              aria-expanded={sidebarOpen}
              onClick={toggleSidebar}
            >
              <span className="block h-0.5 w-5 bg-foreground" />
              <span className="block h-0.5 w-5 bg-foreground" />
              <span className="block h-0.5 w-5 bg-foreground" />
            </button>
            {libraryBar ? (
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className="mt-1 h-8 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: libraryBar.accent }}
                />
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold tracking-tight">
                    {libraryBar.title}
                  </h1>
                  <p className="truncate text-sm text-muted">{libraryBar.summary}</p>
                </div>
              </div>
            ) : (
              <span className="text-sm font-medium">Lessons</span>
            )}
          </div>
          {user ? (
            <div className="flex shrink-0 items-center gap-1 sm:gap-3">
              {libraryBar ? (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:bg-surface"
                  >
                    All libraries
                  </Link>
                  <button
                    type="button"
                    className="rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:bg-surface"
                    onClick={libraryBar.onToggleEdit}
                  >
                    {libraryBar.editing ? "Close" : "Edit library"}
                  </button>
                  {libraryBar.slug === "interview" ? null : (
                    <DeleteLibraryButton id={libraryBar.id} label="Delete library" />
                  )}
                </>
              ) : null}
              <p className="hidden truncate text-sm text-muted sm:block">{user.email}</p>
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
    </LibraryBarContext.Provider>
  );
}
