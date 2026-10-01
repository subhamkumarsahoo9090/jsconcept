import type { Metadata } from "next";
import Link from "next/link";
import { primaryButtonClass } from "@/components/ui/classes";
import { pageMetadata, projectManager } from "@/config/projectmanager";
import { readLibraries } from "@/lib/libraryStore";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata("/");

export default async function HomePage() {
  const { app } = projectManager;
  const libraries = await readLibraries();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-14 sm:py-20">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-background px-6 py-10 shadow-sm sm:px-10 sm:py-14">
        <p className="text-sm font-medium text-primary">{app.name}</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight">
          Coding lessons in English and Hindi.
        </h1>
        <p className="mt-4 max-w-xl text-muted">{app.description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className={primaryButtonClass}>
            Log in
          </Link>
        </div>
      </section>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {libraries.map((library) => (
          <li
            key={library.id}
            className="rounded-2xl border border-border bg-background p-5"
          >
            <span
              className="block h-1.5 w-10 rounded-full"
              style={{ backgroundColor: library.accent }}
            />
            <h2 className="mt-4 text-lg font-semibold">{library.title}</h2>
            <p className="mt-2 text-sm text-muted">{library.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
