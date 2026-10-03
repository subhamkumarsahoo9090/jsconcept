import "server-only";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { readLibraries, updateLibraries } from "@/lib/libraryStore";
import { textToParagraphs } from "@/lib/libraryTypes";

export type NoteInput = {
  librarySlug?: string;
  tabTitle?: string;
  title?: string;
  english?: string;
  hindi?: string;
  code?: string;
  afterLessonId?: string;
};

function clip(value: string, max: number) {
  return value.replace(/\r\n/g, "\n").trim().slice(0, max);
}

export async function saveStudyNote(input: NoteInput) {
  const librarySlug = clip(input.librarySlug ?? "", 80);
  const tabTitle = clip(input.tabTitle ?? "", 80);
  const title = clip(input.title ?? "", 120);
  const english = textToParagraphs(clip(input.english ?? "", 4000)).slice(0, 8);
  const hindi = textToParagraphs(clip(input.hindi ?? "", 4000)).slice(0, 8);
  const code = clip(input.code ?? "", 4000);
  const afterLessonId = clip(input.afterLessonId ?? "", 80);

  if (!librarySlug || !tabTitle || !title || english.length === 0 || hindi.length === 0) {
    return { ok: false as const, error: "The note needs a library, concept, title, English, and Hindi." };
  }

  const library = (await readLibraries()).find((item) => item.slug === librarySlug);
  if (!library) return { ok: false as const, error: "That library was not found." };
  const afterLesson = library.lessons.find((item) => item.id === afterLessonId);
  const namedTab = library.tabs.find(
    (item) => item.title.toLowerCase() === tabTitle.toLowerCase() || item.id === tabTitle,
  );
  const tab =
    (afterLesson ? library.tabs.find((item) => item.id === afterLesson.tabId) : undefined) ??
    namedTab ??
    library.tabs.find((item) =>
      library.lessons.some(
        (lesson) =>
          lesson.tabId === item.id && lesson.title.toLowerCase() === tabTitle.toLowerCase(),
      ),
    );
  if (!tab) {
    return {
      ok: false as const,
      error: `No concept named "${tabTitle}" exists in ${library.title}.`,
    };
  }

  await updateLibraries(async (libraries) =>
    libraries.map((item) => {
      if (item.id !== library.id) return item;
      const note = {
        id: randomUUID(),
        tabId: tab.id,
        title,
        english,
        hindi,
        code,
      };
      const anchor = item.lessons.findIndex((lesson) => lesson.id === afterLessonId);
      const lessons = [...item.lessons];
      if (anchor >= 0) lessons.splice(anchor + 1, 0, note);
      else lessons.push(note);
      return { ...item, lessons };
    }),
  );

  revalidatePath("/", "layout");
  revalidatePath("/dashboard", "layout");
  return {
    ok: true as const,
    library: library.title,
    tab: tab.title,
    path: `/dashboard/${library.slug}?tab=${encodeURIComponent(tab.id)}`,
  };
}
