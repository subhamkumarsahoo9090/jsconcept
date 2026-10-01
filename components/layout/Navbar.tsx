"use client";

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

export default function Navbar({
  brand,
}: {
  brand: { name: string; logo: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useApp();

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background">
      <div className="flex w-full items-center justify-between gap-3 px-6 py-3">
        <Link href="/" className="text-foreground">
          <Logo name={brand.name} logo={brand.logo} />
        </Link>
        <nav className="flex flex-wrap items-center gap-4">
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
          {!ready ? (
            <span className="inline-block h-9 w-28" />
          ) : user ? (
            <>
              <Link href="/dashboard" className={secondaryButtonClass}>
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className={primaryButtonClass}
              >
                Log out
              </button>
            </>
          ) : (
            <Link href="/login" className={primaryButtonClass}>
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
