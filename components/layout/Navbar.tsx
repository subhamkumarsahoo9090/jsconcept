"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "@/components/layout/Logo";
import {
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/classes";
import { useApp } from "@/context/AppProvider";

const links = [{ href: "/", label: "Home" }];

function linkClass(active: boolean) {
  return active
    ? "text-sm font-medium text-primary"
    : "text-sm text-muted hover:text-foreground";
}

function MenuButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-1 rounded-xl hover:bg-surface lg:hidden"
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      onClick={onClick}
    >
      <span className="block h-0.5 w-5 bg-foreground" />
      <span className="block h-0.5 w-5 bg-foreground" />
      <span className="block h-0.5 w-5 bg-foreground" />
    </button>
  );
}

function AccountLinks({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter();
  const { user, ready, logout } = useApp();

  function handleLogout() {
    onNavigate();
    logout();
    router.push("/");
  }

  if (!ready) return <span className="inline-block h-9 w-28" />;
  if (!user) {
    return (
      <Link href="/login" className={primaryButtonClass} onClick={onNavigate}>
        Log in
      </Link>
    );
  }
  return (
    <>
      <Link href="/dashboard" className={secondaryButtonClass} onClick={onNavigate}>
        Dashboard
      </Link>
      <button type="button" onClick={handleLogout} className={primaryButtonClass}>
        Log out
      </button>
    </>
  );
}

export default function Navbar({
  brand,
}: {
  brand: { name: string; logo: string };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background">
      <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="min-w-0 text-foreground">
          <Logo name={brand.name} logo={brand.logo} />
        </Link>
        <MenuButton open={open} onClick={() => setOpen((current) => !current)} />
        <nav className="hidden items-center gap-4 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClass(pathname === link.href)}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          <AccountLinks onNavigate={() => setOpen(false)} />
        </nav>
      </div>
      {open ? (
        <nav className="flex flex-col items-start gap-3 border-t border-border px-4 py-4 lg:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClass(pathname === link.href)}
              aria-current={pathname === link.href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <AccountLinks onNavigate={() => setOpen(false)} />
        </nav>
      ) : null}
    </header>
  );
}
