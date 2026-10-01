export type ConceptTab = {
  id: string;
  title: string;
};

export type Lesson = {
  id: string;
  tabId: string;
  title: string;
  english: string[];
  hindi: string[];
  code: string;
};

export type Library = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  accent: string;
  tabs: ConceptTab[];
  lessons: Lesson[];
};

export type ActionState = {
  error: string | null;
  savedAt: number;
};

export const emptyActionState: ActionState = { error: null, savedAt: 0 };

export function paragraphsToText(parts: string[]) {
  return parts.join("\n\n");
}

export function textToParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}
