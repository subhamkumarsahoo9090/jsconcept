import type { HistoryEntry, QuizQuestion, QuizSession } from "@/lib/interview/types";

const HISTORY_KEY = "jsexport.interviewHistory";
const SESSION_KEY = "jsexport.interviewSession";

function normalizeQuestion(value: unknown): QuizQuestion | null {
  if (!value || typeof value !== "object") return null;
  const question = value as Partial<QuizQuestion>;
  if (typeof question.id !== "string" || typeof question.prompt !== "string") return null;
  const options = Array.isArray(question.options)
    ? question.options.filter((option): option is string => typeof option === "string")
    : [];
  const kind = question.kind === "mcq" && options.length >= 2 ? "mcq" : "written";
  return {
    id: question.id,
    kind,
    prompt: question.prompt,
    options: kind === "mcq" ? options.slice(0, 4) : [],
    correct: typeof question.correct === "string" ? question.correct : "",
    answer: typeof question.answer === "string" ? question.answer : "",
    aiAnswer: typeof question.aiAnswer === "string" ? question.aiAnswer : "",
    score: typeof question.score === "number" ? question.score : null,
    note: typeof question.note === "string" ? question.note : "",
  };
}

export function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is HistoryEntry => {
      if (!item || typeof item !== "object") return false;
      const record = item as HistoryEntry;
      return typeof record.id === "string" && typeof record.prompt === "string";
    });
  } catch {
    return [];
  }
}

export function mergeHistory(entries: HistoryEntry[]) {
  const byId = new Map(readHistory().map((entry) => [entry.id, entry]));
  for (const entry of entries) byId.set(entry.id, entry);
  const next = [...byId.values()].sort((a, b) => b.askedAt - a.askedAt).slice(0, 200);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function readSession(): QuizSession | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null") as QuizSession | null;
    if (!parsed || typeof parsed.topicId !== "string" || !Array.isArray(parsed.questions)) return null;
    const questions = parsed.questions
      .map((question) => normalizeQuestion(question))
      .filter((question): question is QuizQuestion => question !== null);
    return { ...parsed, questions };
  } catch {
    return null;
  }
}

export function writeSession(session: QuizSession | null) {
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else sessionStorage.removeItem(SESSION_KEY);
}
