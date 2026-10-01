import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { categories } from "@/data/tutorials";
import { interviewLibrary } from "@/lib/interviewSeed";
import type { ConceptTab, Lesson, Library } from "@/lib/libraryTypes";

const filePath = path.join(process.cwd(), "data", "library.json");

let writeQueue: Promise<unknown> = Promise.resolve();

function isLesson(value: unknown): value is Lesson {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    Array.isArray(record.english) &&
    record.english.every((part) => typeof part === "string") &&
    Array.isArray(record.hindi) &&
    record.hindi.every((part) => typeof part === "string") &&
    typeof record.code === "string"
  );
}

function isLibrary(value: unknown): value is Library {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.slug === "string" &&
    typeof record.title === "string" &&
    typeof record.summary === "string" &&
    typeof record.accent === "string" &&
    Array.isArray(record.lessons) &&
    record.lessons.every(isLesson)
  );
}

const conceptNames: Record<string, Record<string, string>> = {
  "node-js": {
    "What Node.js is": "Basics",
    "Modules and npm": "Modules",
    "A small HTTP server": "HTTP",
  },
  javascript: {
    "Values and variables": "Values",
    "Functions and arrays": "Functions",
    "Promises and async": "Async",
  },
  react: {
    "Components and JSX": "Components",
    "Props and state": "State",
    "Lists and events": "Lists",
  },
  "next-js": {
    "The app router": "Routing",
    "Layouts and links": "Layouts",
    "Server and client components": "Components",
  },
  "react-native": {
    "Native views, not HTML": "Views",
    "StyleSheet and flex": "Layout",
    "Screens and navigation": "Navigation",
  },
  mongodb: {
    "Documents and collections": "Documents",
    "Create, read, update, delete": "CRUD",
    "Useful queries": "Queries",
  },
  mongoose: {
    Schemas: "Schemas",
    "Models and validation": "Models",
    "References between documents": "Relations",
  },
};

function conceptName(library: { slug: string }, title: string) {
  if (library.slug === "interview") {
    const topic = title.split(":")[0]?.trim();
    if (topic) return topic;
  }
  return conceptNames[library.slug]?.[title] ?? "General";
}

function conceptTabId(libraryId: string, name: string) {
  return `${libraryId}-${slugify(name)}`;
}

function normalizeLibrary(library: Library): { library: Library; changed: boolean } {
  const rawLessons = library.lessons as Array<Lesson & { tabId?: string }>;
  const rawTabs = Array.isArray(library.tabs) ? library.tabs : [];
  const validTabs = rawTabs.filter(
    (tab): tab is ConceptTab =>
      typeof tab?.id === "string" && typeof tab?.title === "string",
  );
  const tabIds = new Set(validTabs.map((tab) => tab.id));
  const complete =
    validTabs.length > 0 &&
    rawLessons.every(
      (lesson) => typeof lesson.tabId === "string" && tabIds.has(lesson.tabId),
    );
  if (complete) return { library, changed: false };

  const tabs: ConceptTab[] = [];
  const lessons = rawLessons.map((lesson) => {
    const name = conceptName(library, lesson.title);
    let tab = tabs.find((item) => item.title === name);
    if (!tab) {
      tab = { id: conceptTabId(library.id, name), title: name };
      tabs.push(tab);
    }
    return { ...lesson, tabId: tab.id };
  });
  if (tabs.length === 0) {
    tabs.push({ id: conceptTabId(library.id, "Basics"), title: "Basics" });
  }
  return {
    library: { ...library, tabs, lessons },
    changed: true,
  };
}

function seedLibraries(): Library[] {
  return categories.map((category) => {
    const library = {
      id: randomUUID(),
      slug: category.slug,
      title: category.title,
      summary: category.summary,
      accent: category.accent,
      tabs: [],
      lessons: category.lessons.map((lesson) => ({
        id: randomUUID(),
        tabId: "",
        title: lesson.title,
        english: lesson.english,
        hindi: lesson.hindi,
        code: lesson.code ?? "",
      })),
    };
    return normalizeLibrary(library).library;
  });
}

async function saveLibraries(libraries: Library[]) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(libraries, null, 2)}\n`, "utf8");
}

async function ensureInterview(libraries: Library[]) {
  if (libraries.some((library) => library.slug === "interview")) {
    return libraries;
  }
  const next = [interviewLibrary(), ...libraries];
  await saveLibraries(next);
  return next;
}

async function loadLibraries(): Promise<Library[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isLibrary)) {
      throw new Error("data/library.json is not a list of libraries.");
    }
    return finishLibraries(parsed);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return finishLibraries(seedLibraries());
    }
    throw error;
  }
}

async function finishLibraries(libraries: Library[]) {
  const withInterview = await ensureInterview(libraries);
  const normalized = withInterview.map((library) => normalizeLibrary(library));
  const next = normalized.map((item) => item.library);
  if (normalized.some((item) => item.changed) || withInterview !== libraries) {
    await saveLibraries(next);
  }
  return next;
}

let pendingRead: Promise<Library[]> | null = null;

export function readLibraries() {
  if (!pendingRead) {
    pendingRead = loadLibraries().finally(() => {
      pendingRead = null;
    });
  }
  return pendingRead;
}

export async function updateLibraries(
  change: (libraries: Library[]) => Library[] | Promise<Library[]>,
) {
  const run = writeQueue.then(async () => {
    const libraries = await readLibraries();
    const next = await change(libraries);
    await saveLibraries(next);
    return next;
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function slugify(title: string) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "library";
}

export function uniqueSlug(
  libraries: Library[],
  title: string,
  exceptId?: string,
) {
  const base = slugify(title);
  let slug = base;
  let count = 2;
  while (
    libraries.some((library) => library.slug === slug && library.id !== exceptId)
  ) {
    slug = `${base}-${count}`;
    count += 1;
  }
  return slug;
}

export function readField(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export function readAccent(formData: FormData) {
  const accent = readField(formData, "accent");
  return /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : "#0f766e";
}
