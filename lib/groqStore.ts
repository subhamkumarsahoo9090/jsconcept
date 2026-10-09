import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeGroqKey } from "@/lib/groqKey";

const filePath = path.join(process.cwd(), "data", "groq.json");

export type StoredGroqKeys = {
  options: string[];
  selected: string;
};

function cleanKey(value: string) {
  return normalizeGroqKey(value);
}

function normalize(value: unknown): StoredGroqKeys {
  const record = value && typeof value === "object" ? (value as { options?: unknown; selected?: unknown }) : {};
  const options = [
    ...new Set(
      (Array.isArray(record.options) ? record.options : [])
        .filter((item): item is string => typeof item === "string")
        .map(cleanKey)
        .filter(Boolean),
    ),
  ];
  const selected = typeof record.selected === "string" ? cleanKey(record.selected) : "";
  return {
    options,
    selected: options.includes(selected) ? selected : (options[0] ?? ""),
  };
}

export async function readStoredGroqKeys(): Promise<StoredGroqKeys> {
  try {
    return normalize(JSON.parse(await readFile(filePath, "utf8")));
  } catch {
    return { options: [], selected: "" };
  }
}

let writeQueue: Promise<unknown> = Promise.resolve();

export function saveStoredGroqKeys(list: StoredGroqKeys) {
  const next = normalize(list);
  const run = writeQueue.then(async () => {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(next, null, 2)}\n`);
    return next;
  });
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
