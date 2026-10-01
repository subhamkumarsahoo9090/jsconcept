"use client";

import { useTransition } from "react";
import { deleteLibrary } from "@/lib/libraryActions";

export default function DeleteLibraryButton({
  id,
  label = "Delete",
}: {
  id: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-full px-3 py-1.5 text-sm text-danger hover:bg-surface"
      onClick={() => {
        if (!window.confirm("Delete this library and every lesson inside it?")) {
          return;
        }
        startTransition(() => {
          void deleteLibrary(id);
        });
      }}
    >
      {pending ? "Deleting..." : label}
    </button>
  );
}
