"use client";

import { useState } from "react";
import Link from "next/link";
import DeleteLibraryButton from "@/components/dashboard/DeleteLibraryButton";
import LibraryForm from "@/components/dashboard/LibraryForm";
import { useApp } from "@/context/AppProvider";
import type { Library } from "@/lib/libraryTypes";

function LibraryCard({ library }: { library: Library }) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="rounded-2xl border border-border bg-background p-5 shadow-sm">
      {editing ? (
        <LibraryForm
          library={library}
          submitLabel="Save library"
          onDone={() => setEditing(false)}
        />
      ) : (
        <>
          <span
            className="block h-1.5 w-12 rounded-full"
            style={{ backgroundColor: library.accent }}
          />
          <h2 className="mt-4 text-lg font-semibold">
            <Link href={`/dashboard/${library.slug}`} className="hover:text-primary">
              {library.title}
            </Link>
          </h2>
          <p className="mt-2 text-sm text-muted">{library.summary}</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <Link
              href={`/dashboard/${library.slug}`}
              className="text-sm font-medium text-primary"
            >
              {library.lessons.length} lessons
            </Link>
            <div className="flex gap-1">
              <button
                type="button"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:bg-surface"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
              <DeleteLibraryButton id={library.id} />
            </div>
          </div>
        </>
      )}
    </li>
  );
}

export default function DashboardHome({ libraries }: { libraries: Library[] }) {
  const { user } = useApp();

  if (!user) return null;

  return (
    <div className="w-full">
      <p className="text-sm font-medium text-primary">Your library</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Welcome, {user.name}
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Add a library, then open it to create, edit, or delete lessons. Every
        change is saved in data/library.json.
      </p>
      <section className="mt-8 rounded-3xl border border-border bg-background p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Add library</h2>
        <div className="mt-4">
          <LibraryForm submitLabel="Add library" />
        </div>
      </section>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {libraries
          .filter((library) => library.slug !== "interview")
          .map((library) => (
            <LibraryCard key={library.id} library={library} />
          ))}
      </ul>
    </div>
  );
}
