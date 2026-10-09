"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  readAccent,
  readField,
  hideLibrary,
  readLibraries,
  uniqueSlug,
  updateLibraries,
} from "@/lib/libraryStore";
import { textToParagraphs, type ActionState } from "@/lib/libraryTypes";

function refreshLibraryViews() {
  revalidatePath("/", "layout");
  revalidatePath("/dashboard", "layout");
}

function libraryInput(formData: FormData) {
  const title = readField(formData, "title");
  const summary = readField(formData, "summary");
  if (!title) return { ok: false as const, error: "Library name is required." };
  if (!summary) {
    return { ok: false as const, error: "A short description is required." };
  }
  return {
    ok: true as const,
    title,
    summary,
    accent: readAccent(formData),
  };
}

function lessonInput(formData: FormData) {
  const title = readField(formData, "title");
  const english = textToParagraphs(String(formData.get("english") ?? ""));
  const hindi = textToParagraphs(String(formData.get("hindi") ?? ""));
  const code = String(formData.get("code") ?? "").replace(/\r\n/g, "\n");
  if (!title) return { ok: false as const, error: "Lesson title is required." };
  if (english.length === 0) {
    return { ok: false as const, error: "English text is required." };
  }
  if (hindi.length === 0) {
    return { ok: false as const, error: "Hindi text is required." };
  }
  return { ok: true as const, title, english, hindi, code: code.trim() };
}

export async function createLibrary(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const input = libraryInput(formData);
  if (!input.ok) return { error: input.error, savedAt: 0 };

  await updateLibraries(async (libraries) => [
    ...libraries,
    {
      id: randomUUID(),
      slug: uniqueSlug(libraries, input.title),
      title: input.title,
      summary: input.summary,
      accent: input.accent,
      tabs: [{ id: randomUUID(), title: "Basics" }],
      lessons: [],
    },
  ]);
  refreshLibraryViews();
  return { error: null, savedAt: Date.now() };
}

export async function updateLibrary(
  id: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const input = libraryInput(formData);
  if (!input.ok) return { error: input.error, savedAt: 0 };

  const current = (await readLibraries()).find((library) => library.id === id);
  if (!current) return { error: "That library was not found.", savedAt: 0 };

  let nextSlug = current.slug;
  await updateLibraries(async (libraries) => {
    nextSlug =
      current.slug === "interview"
        ? "interview"
        : uniqueSlug(libraries, input.title, id);
    return libraries.map((library) =>
      library.id === id
        ? {
            ...library,
            title: input.title,
            summary: input.summary,
            accent: input.accent,
            slug: nextSlug,
          }
        : library,
    );
  });
  refreshLibraryViews();
  if (nextSlug !== current.slug) redirect(`/dashboard/${nextSlug}`);
  return { error: null, savedAt: Date.now() };
}

function isReadOnlyFs(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  const message = error instanceof Error ? error.message : "";
  return code === "EROFS" || code === "EACCES" || /read-only file system|EROFS/i.test(message);
}

export async function deleteLibrary(id: string): Promise<ActionState> {
  const current = (await readLibraries()).find((library) => library.id === id);
  if (!current) return { error: null, savedAt: Date.now() };
  if (current.slug === "interview") {
    return { error: "Interview cannot be deleted.", savedAt: 0 };
  }

  try {
    await updateLibraries(async (libraries) =>
      libraries.filter((library) => library.id !== id),
    );
  } catch (error) {
    if (!isReadOnlyFs(error)) {
      return { error: "Could not delete that library.", savedAt: 0 };
    }
    await hideLibrary(id);
  }
  refreshLibraryViews();
  return { error: null, savedAt: Date.now() };
}

export async function createLesson(
  libraryId: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const input = lessonInput(formData);
  if (!input.ok) return { error: input.error, savedAt: 0 };
  const tabId = readField(formData, "tabId");

  let found = false;
  let tabError = false;
  await updateLibraries(async (libraries) =>
    libraries.map((library) => {
      if (library.id !== libraryId) return library;
      found = true;
      if (!library.tabs.some((tab) => tab.id === tabId)) {
        tabError = true;
        return library;
      }
      return {
        ...library,
        lessons: [
          ...library.lessons,
          {
            id: randomUUID(),
            tabId,
            title: input.title,
            english: input.english,
            hindi: input.hindi,
            code: input.code,
          },
        ],
      };
    }),
  );
  if (tabError) return { error: "Choose a concept tab first.", savedAt: 0 };
  if (!found) return { error: "That library was not found.", savedAt: 0 };
  refreshLibraryViews();
  return { error: null, savedAt: Date.now() };
}

export async function updateLesson(
  libraryId: string,
  lessonId: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const input = lessonInput(formData);
  if (!input.ok) return { error: input.error, savedAt: 0 };

  let found = false;
  await updateLibraries(async (libraries) =>
    libraries.map((library) => {
      if (library.id !== libraryId) return library;
      return {
        ...library,
        lessons: library.lessons.map((lesson) => {
          if (lesson.id !== lessonId) return lesson;
          found = true;
          const tabId = readField(formData, "tabId");
          return {
            ...lesson,
            tabId: library.tabs.some((tab) => tab.id === tabId)
              ? tabId
              : lesson.tabId,
            title: input.title,
            english: input.english,
            hindi: input.hindi,
            code: input.code,
          };
        }),
      };
    }),
  );
  if (!found) return { error: "That lesson was not found.", savedAt: 0 };
  refreshLibraryViews();
  return { error: null, savedAt: Date.now() };
}

export async function createConceptTab(
  libraryId: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const title = readField(formData, "title");
  if (!title) return { error: "Concept name is required.", savedAt: 0 };

  let found = false;
  let duplicate = false;
  await updateLibraries(async (libraries) =>
    libraries.map((library) => {
      if (library.id !== libraryId) return library;
      found = true;
      if (
        library.tabs.some(
          (tab) => tab.title.toLowerCase() === title.toLowerCase(),
        )
      ) {
        duplicate = true;
        return library;
      }
      return {
        ...library,
        tabs: [...library.tabs, { id: randomUUID(), title }],
      };
    }),
  );
  if (!found) return { error: "That library was not found.", savedAt: 0 };
  if (duplicate) return { error: "That concept already exists.", savedAt: 0 };
  refreshLibraryViews();
  return { error: null, savedAt: Date.now() };
}

export async function renameConceptTab(
  libraryId: string,
  tabId: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const title = readField(formData, "title");
  if (!title) return { error: "Concept name is required.", savedAt: 0 };

  let found = false;
  await updateLibraries(async (libraries) =>
    libraries.map((library) => {
      if (library.id !== libraryId) return library;
      return {
        ...library,
        tabs: library.tabs.map((tab) => {
          if (tab.id !== tabId) return tab;
          found = true;
          return { ...tab, title };
        }),
      };
    }),
  );
  if (!found) return { error: "That concept was not found.", savedAt: 0 };
  refreshLibraryViews();
  return { error: null, savedAt: Date.now() };
}

export async function deleteConceptTab(libraryId: string, tabId: string) {
  await updateLibraries(async (libraries) =>
    libraries.map((library) => {
      if (library.id !== libraryId) return library;
      if (library.tabs.length <= 1) return library;
      const tabs = library.tabs.filter((tab) => tab.id !== tabId);
      const fallback = tabs[0]?.id;
      if (!fallback) return library;
      return {
        ...library,
        tabs,
        lessons: library.lessons.map((lesson) =>
          lesson.tabId === tabId ? { ...lesson, tabId: fallback } : lesson,
        ),
      };
    }),
  );
  refreshLibraryViews();
}

export async function deleteLesson(libraryId: string, lessonId: string) {
  await updateLibraries(async (libraries) =>
    libraries.map((library) =>
      library.id === libraryId
        ? {
            ...library,
            lessons: library.lessons.filter((lesson) => lesson.id !== lessonId),
          }
        : library,
    ),
  );
  refreshLibraryViews();
}
