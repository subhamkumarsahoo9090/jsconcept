import Link from "next/link";
import Logo from "@/components/layout/Logo";
import { projectManager } from "@/config/projectmanager";

const links = [
  { href: "/", label: "Home" },
  { href: "/login", label: "Log in" },
];

export default function Footer() {
  const { company } = projectManager;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-3">
        <div>
          <Logo name={projectManager.app.name} logo={projectManager.app.logo} />
          <p className="mt-3 text-sm text-muted">{company.address}</p>
        </div>
        <nav className="flex flex-col gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="text-sm text-muted">
          <p>{company.name}</p>
          <a className="mt-2 block hover:text-foreground" href={`mailto:${company.email}`}>
            {company.email}
          </a>
          <a className="mt-1 block hover:text-foreground" href={`tel:${company.phone}`}>
            {company.phone}
          </a>
        </div>
      </div>
      <p className="border-t border-border px-4 py-4 text-center text-xs text-muted">
        © {year} {company.name}
      </p>
    </footer>
  );
}
