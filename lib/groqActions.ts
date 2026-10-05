"use server";

import { readStoredGroqKeys as readKeys, saveStoredGroqKeys as saveKeys } from "@/lib/groqStore";

export async function readStoredGroqKeys() {
  return readKeys();
}

export async function saveStoredGroqKeys(list: { options: string[]; selected: string }) {
  return saveKeys(list);
}
