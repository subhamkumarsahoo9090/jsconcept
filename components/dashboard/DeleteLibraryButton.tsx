"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteLibrary } from "@/lib/libraryActions";

export default function DeleteLibraryButton({
  id,
  label = "Delete",
  leavePage = false,
}: {
  id: string;
  label?: string;
  leavePage?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        disabled={pending}
        className="rounded-full px-3 py-1.5 text-sm text-danger hover:bg-surface"
        onClick={() => {
          if (!window.confirm("Delete this library and every lesson inside it?")) {
            return;
          }
          setError("");
          startTransition(() => {
            void (async () => {
              const result = await deleteLibrary(id);
              if (result.error) {
                setError(result.error);
                return;
              }
              if (leavePage) router.push("/dashboard");
              router.refresh();
            })();
          });
        }}
      >
        {pending ? "Deleting..." : label}
      </button>
      {error ? <span className="px-2 text-xs text-danger">{error}</span> : null}
    </span>
  );
}
