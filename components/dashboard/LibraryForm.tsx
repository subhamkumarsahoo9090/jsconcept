"use client";

import { useActionState, useEffect, useRef } from "react";
import { createLibrary, updateLibrary } from "@/lib/libraryActions";
import { emptyActionState, type Library } from "@/lib/libraryTypes";
import {
  errorClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/classes";

export default function LibraryForm({
  library,
  submitLabel,
  onDone,
}: {
  library?: Library;
  submitLabel: string;
  onDone?: () => void;
}) {
  const action = library
    ? updateLibrary.bind(null, library.id)
    : createLibrary;
  const [state, formAction, pending] = useActionState(action, emptyActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!state.savedAt) return;
    if (!library) formRef.current?.reset();
    onDoneRef.current?.();
  }, [state.savedAt, library]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3">
      <div>
        <label className={labelClass} htmlFor={`${library?.id ?? "new"}-title`}>
          Library name
        </label>
        <input
          id={`${library?.id ?? "new"}-title`}
          name="title"
          required
          defaultValue={library?.title ?? ""}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor={`${library?.id ?? "new"}-summary`}>
          Description
        </label>
        <textarea
          id={`${library?.id ?? "new"}-summary`}
          name="summary"
          required
          rows={3}
          defaultValue={library?.summary ?? ""}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor={`${library?.id ?? "new"}-accent`}>
          Color
        </label>
        <input
          id={`${library?.id ?? "new"}-accent`}
          name="accent"
          type="color"
          defaultValue={library?.accent ?? "#0f766e"}
          className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-background"
        />
      </div>
      {state.error ? (
        <p className={errorClass} role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Saving..." : submitLabel}
        </button>
        {onDone ? (
          <button type="button" onClick={onDone} className={secondaryButtonClass}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
