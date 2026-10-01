"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  createConceptTab,
  deleteConceptTab,
  renameConceptTab,
} from "@/lib/libraryActions";
import { emptyActionState, type ConceptTab } from "@/lib/libraryTypes";
import {
  errorClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/classes";

export default function ConceptTabs({
  libraryId,
  tabs,
  activeId,
  onChange,
}: {
  libraryId: string;
  tabs: ConceptTab[];
  activeId: string;
  onChange: (tabId: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [pendingDelete, startDelete] = useTransition();
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  const createAction = createConceptTab.bind(null, libraryId);
  const [createState, createFormAction, creating] = useActionState(
    createAction,
    emptyActionState,
  );
  const renameAction = renameConceptTab.bind(
    null,
    libraryId,
    active?.id ?? "",
  );
  const [renameState, renameFormAction, renamingPending] = useActionState(
    renameAction,
    emptyActionState,
  );
  const createRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!createState.savedAt) return;
    createRef.current?.reset();
    setAdding(false);
  }, [createState.savedAt]);

  useEffect(() => {
    if (renameState.savedAt) setRenaming(false);
  }, [renameState.savedAt]);

  return (
    <div className="mt-6">
      <div className="flex gap-2 overflow-x-auto border-b border-border">
        {tabs.map((tab) => {
          const selected = tab.id === active?.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium ${
                selected
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
              aria-current={selected ? "page" : undefined}
              onClick={() => onChange(tab.id)}
            >
              {tab.title}
            </button>
          );
        })}
        <button
          type="button"
          className="shrink-0 px-4 py-2 text-sm font-medium text-primary"
          onClick={() => setAdding((open) => !open)}
        >
          {adding ? "Close" : "+ Concept"}
        </button>
      </div>
      {adding ? (
        <form
          ref={createRef}
          action={createFormAction}
          className="mt-4 flex flex-wrap items-center gap-2"
        >
          <input
            name="title"
            required
            placeholder="Concept name"
            className={`${inputClass} max-w-xs`}
          />
          <button type="submit" disabled={creating} className={primaryButtonClass}>
            {creating ? "Adding..." : "Add tab"}
          </button>
          {createState.error ? (
            <p className={errorClass} role="alert">
              {createState.error}
            </p>
          ) : null}
        </form>
      ) : null}
      {active ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {renaming ? (
            <form action={renameFormAction} className="flex flex-wrap items-center gap-2">
              <input
                name="title"
                required
                defaultValue={active.title}
                className={`${inputClass} max-w-xs`}
              />
              <button
                type="submit"
                disabled={renamingPending}
                className={primaryButtonClass}
              >
                {renamingPending ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => setRenaming(false)}
              >
                Cancel
              </button>
              {renameState.error ? (
                <p className={errorClass} role="alert">
                  {renameState.error}
                </p>
              ) : null}
            </form>
          ) : (
            <>
              <button
                type="button"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:bg-surface"
                onClick={() => setRenaming(true)}
              >
                Rename tab
              </button>
              {tabs.length > 1 ? (
                <button
                  type="button"
                  disabled={pendingDelete}
                  className="rounded-full px-3 py-1.5 text-sm text-danger hover:bg-surface"
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Delete this concept tab? Its lessons move to the next tab.",
                      )
                    ) {
                      return;
                    }
                    startDelete(() => {
                      void deleteConceptTab(libraryId, active.id);
                    });
                  }}
                >
                  {pendingDelete ? "Deleting..." : "Delete tab"}
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
