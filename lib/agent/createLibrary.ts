import "server-only";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { readLibraries, uniqueSlug, updateLibraries } from "@/lib/libraryStore";

const LIBRARY_WORD = "library|libraries|libary|labray|labrary|libray";

function cleanTitle(value: string) {
  const title = value
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/[.!?]+$/, "")
    .replace(/\s+(?:in|on|inside|under)\s+(?:all\s+)?(?:the\s+)?(?:libraries|library)\.?$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (title.length < 2 || title.length > 80) return "";
  if (/^(a\s+)?(new\s+)?(library|libraries)$/i.test(title)) return "";
  return title;
}

export function libraryNameFrom(text: string) {
  const source = text.replace(/\s+/g, " ").trim();
  const asked = new RegExp(
    `(?:create|make|add|banao|bana)\\s+(?:a\\s+|an\\s+|the\\s+|ek\\s+)?(?:new\\s+)?(?:${LIBRARY_WORD})\\b`,
    "i",
  ).test(source);
  if (!asked) return { asked: false, title: "" };

  const named = source.match(
    new RegExp(
      `(?:create|make|add|banao|bana)\\s+(?:a\\s+|an\\s+|the\\s+|ek\\s+)?(?:new\\s+)?(?:${LIBRARY_WORD})\\s+(?:with\\s+(?:the\\s+)?)?(?:name(?:d)?|called|naam|title)\\s+(.+)$`,
      "i",
    ),
  );
  const loose = source.match(
    new RegExp(
      `(?:create|make|add|banao|bana)\\s+(?:a\\s+|an\\s+|the\\s+|ek\\s+)?(?:new\\s+)?(?:${LIBRARY_WORD})\\s+(.+)$`,
      "i",
    ),
  );
  const looseTitle = loose?.[1] ?? "";
  const title = cleanTitle(
    named?.[1] || (/^(with|the|name|named|called)\b/i.test(looseTitle) ? "" : looseTitle),
  );
  return { asked: true, title };
}

export async function createAgentLibrary(title: string) {
  const name = cleanTitle(title);
  if (!name) return { ok: false as const, error: "Tell me the library name." };

  const existing = (await readLibraries()).find(
    (library) => library.title.toLowerCase() === name.toLowerCase(),
  );
  if (existing) {
    return {
      ok: true as const,
      created: false,
      title: existing.title,
      path: `/dashboard/${existing.slug}`,
    };
  }

  const id = randomUUID();
  const tabId = randomUUID();
  let slug = "library";
  await updateLibraries(async (libraries) => {
    slug = uniqueSlug(libraries, name);
    return [
      ...libraries,
      {
        id,
        slug,
        title: name,
        summary: `A library for ${name}.`,
        accent: "#0f766e",
        tabs: [{ id: tabId, title: "Basics" }],
        lessons: [],
      },
    ];
  });

  revalidatePath("/", "layout");
  revalidatePath("/dashboard", "layout");
  return {
    ok: true as const,
    created: true,
    title: name,
    path: `/dashboard/${slug}`,
  };
}
