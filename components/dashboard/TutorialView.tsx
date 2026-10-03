"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ConceptTabs from "@/components/dashboard/ConceptTabs";
import LibraryForm from "@/components/dashboard/LibraryForm";
import { AddLessonForm, LessonCard } from "@/components/dashboard/LessonForm";
import { useLibraryBar } from "@/components/layout/DashboardShell";
import type { Library } from "@/lib/libraryTypes";

export default function TutorialView({ category }: { category: Library }) {
  const [editing, setEditing] = useState(false);
  const [activeTabId, setActiveTabId] = useState(category.tabs[0]?.id ?? "");
  const tabCount = useRef(category.tabs.length);
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");

  useEffect(() => {
    if (requestedTab) {
      const match = category.tabs.find(
        (tab) =>
          tab.id === requestedTab ||
          tab.title.toLowerCase() === requestedTab.toLowerCase(),
      );
      if (match) {
        if (match.id !== activeTabId) setActiveTabId(match.id);
        tabCount.current = category.tabs.length;
        return;
      }
    }
    if (category.tabs.length > tabCount.current) {
      setActiveTabId(category.tabs[category.tabs.length - 1]?.id ?? "");
    } else if (!category.tabs.some((tab) => tab.id === activeTabId)) {
      setActiveTabId(category.tabs[0]?.id ?? "");
    }
    tabCount.current = category.tabs.length;
  }, [category.tabs, activeTabId, requestedTab]);

  const visibleLessons = category.lessons.filter(
    (lesson) => lesson.tabId === activeTabId,
  );
  const libraryBar = useMemo(
    () => ({
      id: category.id,
      title: category.title,
      summary: category.summary,
      accent: category.accent,
      slug: category.slug,
      editing,
      onToggleEdit: () => setEditing((open) => !open),
    }),
    [
      category.id,
      category.title,
      category.summary,
      category.accent,
      category.slug,
      editing,
    ],
  );
  useLibraryBar(libraryBar);

  return (
    <div className="w-full">
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
        extra={
          <AddLessonForm
            key={activeTabId}
            libraryId={category.id}
            tabs={category.tabs}
            activeTabId={activeTabId}
            inline
          />
        }
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
