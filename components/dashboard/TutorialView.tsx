"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ConceptTabs from "@/components/dashboard/ConceptTabs";
import DeleteLibraryButton from "@/components/dashboard/DeleteLibraryButton";
import LibraryForm from "@/components/dashboard/LibraryForm";
import { AddLessonForm, LessonCard } from "@/components/dashboard/LessonForm";
import type { Library } from "@/lib/libraryTypes";

export default function TutorialView({ category }: { category: Library }) {
  const [editing, setEditing] = useState(false);
  const [activeTabId, setActiveTabId] = useState(category.tabs[0]?.id ?? "");
  const tabCount = useRef(category.tabs.length);

  useEffect(() => {
    if (category.tabs.length > tabCount.current) {
      setActiveTabId(category.tabs[category.tabs.length - 1]?.id ?? "");
    } else if (!category.tabs.some((tab) => tab.id === activeTabId)) {
      setActiveTabId(category.tabs[0]?.id ?? "");
    }
    tabCount.current = category.tabs.length;
  }, [category.tabs, activeTabId]);

  const visibleLessons = category.lessons.filter(
    (lesson) => lesson.tabId === activeTabId,
  );

  return (
    <div className="w-full">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-primary hover:underline"
      >
        All libraries
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span
            className="mt-1 h-10 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: category.accent }}
          />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {category.title}
            </h1>
            <p className="mt-2 text-sm text-muted">{category.summary}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:bg-surface"
            onClick={() => setEditing((open) => !open)}
          >
            {editing ? "Close" : "Edit library"}
          </button>
          {category.slug === "interview" ? null : (
            <DeleteLibraryButton id={category.id} label="Delete library" />
          )}
        </div>
      </div>
      {editing ? (
        <div className="mt-6 rounded-3xl border border-border bg-background p-5">
          <LibraryForm
            library={category}
            submitLabel="Save library"
            onDone={() => setEditing(false)}
          />
        </div>
      ) : null}
      <ConceptTabs
        libraryId={category.id}
        tabs={category.tabs}
        activeId={activeTabId}
        onChange={setActiveTabId}
      />
      <AddLessonForm
        key={activeTabId}
        libraryId={category.id}
        tabs={category.tabs}
        activeTabId={activeTabId}
      />
      <ol className="mt-6 flex flex-col gap-6">
        {visibleLessons.map((lesson, index) => (
          <LessonCard
            key={lesson.id}
            libraryId={category.id}
            lesson={lesson}
            tabs={category.tabs}
            index={index}
          />
        ))}
      </ol>
      {visibleLessons.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No lessons in this concept yet.</p>
      ) : null}
    </div>
  );
}
