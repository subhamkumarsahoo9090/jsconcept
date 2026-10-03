"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
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
  extra,
}: {
  libraryId: string;
  tabs: ConceptTab[];
  activeId: string;
  onChange: (tabId: string) => void;
  extra?: ReactNode;
}) {
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingDelete, startDelete] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
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
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? tabs.filter((tab) => tab.title.toLowerCase().includes(needle))
    : tabs;

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!createState.savedAt) return;
    createRef.current?.reset();
    setAdding(false);
  }, [createState.savedAt]);

  useEffect(() => {
    if (renameState.savedAt) setRenaming(false);
  }, [renameState.savedAt]);

  function choose(tabId: string) {
    onChange(tabId);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <div ref={menuRef} className="relative min-w-0 flex-1">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-left text-sm"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            <span className="truncate font-medium">
              {active?.title ?? "Choose a concept"}
            </span>
            <span className="shrink-0 text-xs text-muted">
              {open ? "Close" : "Search"}
            </span>
          </button>
          {open ? (
            <div className="absolute z-20 mt-2 w-full rounded-2xl border border-border bg-background p-2 shadow-xl">
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search concepts"
                aria-label="Search concepts"
                className={inputClass}
              />
              <ul
                role="listbox"
                aria-label="Concepts"
                className="mt-2 max-h-60 overflow-y-auto"
              >
                {matches.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted">
                    No matching concepts
                  </li>
                ) : (
                  matches.map((tab) => {
                    const selected = tab.id === active?.id;
                    return (
                      <li key={tab.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                            selected
                              ? "bg-surface font-medium text-primary"
                              : "hover:bg-surface"
                          }`}
                          onClick={() => choose(tab.id)}
                        >
                          {tab.title}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:bg-surface"
            onClick={() => setAdding((current) => !current)}
          >
            {adding ? "Close" : "+ Concept"}
          </button>
          {active && renaming ? (
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
            </form>
          ) : (
            <>
              <button
                type="button"
                className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:bg-surface"
                onClick={() => setRenaming(true)}
              >
                Rename tab
              </button>
              {tabs.length > 1 && active ? (
                <button
                  type="button"
                  disabled={pendingDelete}
                  className="shrink-0 rounded-full px-3 py-1.5 text-sm text-danger hover:bg-surface"
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
          {extra}
        </div>
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
      {renameState.error ? (
        <p className={`${errorClass} mt-3`} role="alert">
          {renameState.error}
        </p>
      ) : null}
    </div>
  );
}
