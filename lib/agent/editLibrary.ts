import "server-only";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { libraryNameFrom } from "@/lib/agent/createLibrary";
import { cleanPath } from "@/lib/agent/pages";
import { updateLibraries } from "@/lib/libraryStore";
import type { Library } from "@/lib/libraryTypes";

type ChatLine = { role: string; content: string };

function cleanName(value: string) {
  const title = value
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/[.!?]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (title.length < 2 || title.length > 80) return "";
  if (/^(that|this|it|there|concept|a|the)$/i.test(title)) return "";
  return title;
}

function cleanLine(value: string) {
  const line = value
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!line || line.length > 500) return "";
  return line;
}

export function conceptNameFrom(text: string) {
  const source = text.replace(/\s+/g, " ").trim();
  const asked =
    /(?:create|make|add|banao|bana)\s+(?:a\s+|an\s+|the\s+|ek\s+)?(?:new\s+)?concepts?\b/i.test(
      source,
    );
  if (!asked) return { asked: false, title: "" };
  const named = source.match(
    /(?:create|make|add|banao|bana)\s+(?:a\s+|an\s+|the\s+|ek\s+)?(?:new\s+)?concepts?\s+(?:with\s+(?:the\s+)?)?(?:name(?:d)?|called|naam|title)?\s*:?\s*(.+)$/i,
  );
  return { asked: true, title: cleanName(named?.[1] ?? "") };
}

export function confirmNote(libraryTitle: string, conceptTitle: string, line: string) {
  return [
    `You are on ${libraryTitle}, concept ${conceptTitle}. Write this note there?`,
    `Note: ${line}`,
    "Reply yes, or send the concept name.",
  ].join("\n");
}

export function pendingNote(text: string) {
  const match = text.match(
    /You are on (.+?), concept (.+?)\. Write this note there\?\nNote: (.+)\nReply yes, or send the concept name\./,
  );
  if (!match) return null;
  return { libraryTitle: match[1].trim(), conceptTitle: match[2].trim(), line: match[3].trim() };
}

export function isYes(text: string) {
  return /^(?:yes|yeah|yep|yup|ok|okay|haan|ha+|confirm|theek(?:\s+hai)?|sure|write there|save there|do it)(?:\s+please)?\.?$/i.test(
    text.trim(),
  );
}

export function isNo(text: string) {
  return /^(no|nope|nah|nahi|cancel|mat likho|don't|do not)\.?$/i.test(text.trim());
}

export function lineRequestFrom(text: string) {
  const source = text.replace(/\s+/g, " ").trim();
  const inside = source.match(
    /(?:inside|in)\s+(?:the\s+)?(?:concept\s+)?(.+?)\s+(?:add|likho|write|put|insert|save)\s+(?:a\s+|the\s+|this\s+)?(?:line|text|sentence|note)\s+(.+)$/i,
  );
  if (inside) {
    const target = inside[1].trim();
    return {
      asked: true,
      concept: /^(that|this|it|there)$/i.test(target) ? "" : cleanName(target),
      line: cleanLine(inside[2]),
    };
  }
  const simple = source.match(
    /^(?:please\s+)?(?:add|likho|write|put|insert|save)\s+(?:a\s+|the\s+|this\s+)?(?:line|text|sentence|note)\b\s*(.*)$/i,
  );
  if (simple) return { asked: true, concept: "", line: cleanLine(simple[1]) };
  return { asked: false, concept: "", line: "" };
}

export function mentionedConcept(text: string, library: Library) {
  const source = ` ${text.toLowerCase()} `;
  return (
    library.tabs
      .filter((tab) => tab.title.length > 1 && source.includes(` ${tab.title.toLowerCase()} `))
      .sort((left, right) => right.title.length - left.title.length)[0]?.title ?? ""
  );
}

export function detachConcept(line: string, library: Library) {
  const match = line.match(/^(.*)\s+(?:in|inside|under)\s+(?:the\s+)?(?:concept\s+|tab\s+)?(.+)$/i);
  if (!match) return { line, concept: "" };
  const concept = library.tabs.find(
    (tab) => tab.title.toLowerCase() === match[2].trim().toLowerCase(),
  );
  if (!concept) return { line, concept: "" };
  return { line: cleanLine(match[1]), concept: concept.title };
}

export function libraryFromContext(libraries: Library[], pathname: string, history: ChatLine[]) {
  const parsed = cleanPath(pathname);
  if (parsed?.pathname.startsWith("/dashboard/")) {
    const slug = decodeURIComponent(parsed.pathname.slice("/dashboard/".length));
    const current = libraries.find((library) => library.slug === slug);
    if (current) return current;
  }
  for (const message of [...history].reverse()) {
    const named = libraryNameFrom(message.content);
    if (named.title) {
      const found = libraries.find(
        (library) => library.title.toLowerCase() === named.title.toLowerCase(),
      );
      if (found) return found;
    }
    const created = message.content.match(/Created the library (.+)\./i);
    if (created) {
      const found = libraries.find(
        (library) => library.title.toLowerCase() === created[1].trim().toLowerCase(),
      );
      if (found) return found;
    }
  }
  return null;
}

export function conceptFromContext(
  library: Library,
  pathname: string,
  history: ChatLine[],
  explicit: string,
) {
  if (explicit) return explicit;
  for (const message of [...history].reverse()) {
    const named = conceptNameFrom(message.content);
    if (named.title) return named.title;
    const created = message.content.match(/Created the concept (.+)\./i);
    if (created) return created[1].trim();
  }
  const parsed = cleanPath(pathname);
  const open = library.tabs.find(
    (tab) =>
      tab.id === parsed?.tab || tab.title.toLowerCase() === (parsed?.tab ?? "").toLowerCase(),
  );
  return open?.title || library.tabs.at(-1)?.title || "Basics";
}

function refresh() {
  revalidatePath("/", "layout");
  revalidatePath("/dashboard", "layout");
}

export async function createAgentConcept(libraryId: string, title: string) {
  const name = cleanName(title);
  if (!name) return { ok: false as const, error: "Tell me the concept name." };

  let found = false;
  let created = false;
  let slug = "";
  let libraryTitle = "";
  let tabId = "";
  let tabTitle = name;

  await updateLibraries(async (libraries) =>
    libraries.map((library) => {
      if (library.id !== libraryId) return library;
      found = true;
      slug = library.slug;
      libraryTitle = library.title;
      const existing = library.tabs.find((tab) => tab.title.toLowerCase() === name.toLowerCase());
      if (existing) {
        tabId = existing.id;
        tabTitle = existing.title;
        return library;
      }
      tabId = randomUUID();
      created = true;
      return { ...library, tabs: [...library.tabs, { id: tabId, title: name }] };
    }),
  );

  if (!found || !tabId) return { ok: false as const, error: "That library was not found." };
  if (created) refresh();
  return {
    ok: true as const,
    created,
    title: tabTitle,
    library: libraryTitle,
    path: `/dashboard/${slug}?tab=${encodeURIComponent(tabId)}`,
  };
}

export async function addAgentLine(libraryId: string, conceptTitle: string, line: string) {
  const text = cleanLine(line);
  if (!text) return { ok: false as const, error: "Tell me the line to add." };
  const concept = await createAgentConcept(libraryId, conceptTitle);
  if (!concept.ok) return concept;

  let added = false;
  let path = concept.path;
  await updateLibraries(async (libraries) =>
    libraries.map((library) => {
      if (library.id !== libraryId) return library;
      const tab = library.tabs.find((item) => item.title.toLowerCase() === concept.title.toLowerCase());
      if (!tab) return library;
      path = `/dashboard/${library.slug}?tab=${encodeURIComponent(tab.id)}`;
      const already = library.lessons.some(
        (lesson) =>
          lesson.tabId === tab.id &&
          (lesson.title.toLowerCase() === text.toLowerCase() ||
            lesson.english.some((paragraph) => paragraph.toLowerCase() === text.toLowerCase())),
      );
      if (already) return library;
      added = true;
      return {
        ...library,
        lessons: [
          ...library.lessons,
          {
            id: randomUUID(),
            tabId: tab.id,
            title: text.slice(0, 80),
            english: [text],
            hindi: [text],
            code: "",
          },
        ],
      };
    }),
  );

  if (added) refresh();
  return {
    ok: true as const,
    added,
    conceptCreated: concept.created,
    title: concept.title,
    library: concept.library,
    line: text,
    path,
  };
}
