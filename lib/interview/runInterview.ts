import "server-only";

import { loadLibraries } from "@/lib/agent/pages";
import { searchOpenSources } from "@/lib/agent/search";
import type { Lesson, Library } from "@/lib/libraryTypes";

const DEFAULT_MODEL = "openai/gpt-oss-20b";

type TopicMatch = {
  library: Library;
  tabTitle: string;
  tabId: string;
};

function clip(value: string, max: number) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function parseJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("The interviewer returned an unreadable reply.");
  try {
    return JSON.parse(raw.slice(start, end + 1)) as unknown;
  } catch {
    throw new Error("The interviewer returned an unreadable reply.");
  }
}

async function complete(apiKey: string, model: string, system: string, user: string, maxTokens: number) {
  const body = {
    model: model || DEFAULT_MODEL,
    temperature: 0.4,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
  let response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...body, response_format: { type: "json_object" } }),
  });
  if (response.status === 400) {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }
  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  if (!response.ok) throw new Error(payload.error?.message || "Groq could not answer.");
  return parseJson(payload.choices?.[0]?.message?.content ?? "");
}

async function findTopic(topicId: string): Promise<TopicMatch> {
  const split = topicId.indexOf(":");
  const slug = split === -1 ? "" : topicId.slice(0, split);
  const tabId = split === -1 ? "" : topicId.slice(split + 1);
  const libraries = await loadLibraries();
  const library = libraries.find((item) => item.slug === slug && item.slug !== "interview");
  const tab = library?.tabs.find((item) => item.id === tabId);
  if (!library || !tab) throw new Error("That concept is not in the library.");
  return { library, tabTitle: tab.title, tabId: tab.id };
}

function catalog(libraries: Library[]) {
  return libraries
    .filter((library) => library.slug !== "interview")
    .map((library) => `${library.title}: ${library.tabs.map((tab) => tab.title).join(", ")}`)
    .join("\n")
    .slice(0, 2500);
}

function lessonNotes(lessons: Lesson[]) {
  const body = lessons
    .map((lesson) => {
      const english = clip(lesson.english.join(" "), 360);
      const code = clip(lesson.code, 240);
      return [`Lesson: ${lesson.title}`, english, code ? `Code: ${code}` : ""].filter(Boolean).join("\n");
    })
    .join("\n\n");
  return body.slice(0, 3200) || "This concept has no lesson text yet. Use the public notes and write beginner interview questions.";
}

async function sourcePack(topic: TopicMatch) {
  const libraries = await loadLibraries();
  const lessons = topic.library.lessons.filter((lesson) => lesson.tabId === topic.tabId);
  const web = await searchOpenSources(
    `${topic.library.title} ${topic.tabTitle} interview questions`,
  );
  return {
    libraries,
    brief: [
      `SELECTED: ${topic.library.title} · ${topic.tabTitle}`,
      "ALL CONCEPTS",
      catalog(libraries),
      "LIBRARY NOTES",
      lessonNotes(lessons),
      "PUBLIC NOTES",
      web,
    ].join("\n"),
  };
}

type DraftQuestion = {
  kind: "mcq" | "written";
  prompt: string;
  options: string[];
  correct: string;
};

function asOptions(value: unknown) {
  if (!Array.isArray(value)) return [];
  const options: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") continue;
    const clean = item.replace(/\s+/g, " ").trim().slice(0, 140);
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    options.push(clean);
    if (options.length === 4) break;
  }
  return options;
}

function correctOption(options: string[], value: unknown) {
  if (typeof value === "number" && options[value]) return options[value];
  if (typeof value !== "string") return "";
  const text = value.replace(/\s+/g, " ").trim();
  const letter = text.match(/^[A-D]$/i);
  if (letter) return options["ABCD".indexOf(letter[0].toUpperCase())] ?? "";
  return options.find((option) => option.toLowerCase() === text.toLowerCase()) ?? "";
}

function questionsFrom(value: unknown): DraftQuestion[] {
  const record = value && typeof value === "object" ? (value as { questions?: unknown }) : {};
  if (!Array.isArray(record.questions)) return [];
  const mcq: DraftQuestion[] = [];
  const written: DraftQuestion[] = [];
  const seen = new Set<string>();
  for (const item of record.questions) {
    if (!item || typeof item !== "object") continue;
    const row = item as {
      kind?: unknown;
      prompt?: unknown;
      options?: unknown;
      choices?: unknown;
      correct?: unknown;
    };
    const prompt = typeof row.prompt === "string" ? row.prompt.replace(/\s+/g, " ").trim().slice(0, 320) : "";
    const key = prompt.toLowerCase();
    if (prompt.length < 12 || seen.has(key)) continue;
    if (row.kind === "written") {
      if (written.length > 0) continue;
      seen.add(key);
      written.push({ kind: "written", prompt, options: [], correct: "" });
      continue;
    }
    const options = asOptions(row.options ?? row.choices);
    const correct = correctOption(options, row.correct);
    if (options.length < 4 || !correct) continue;
    seen.add(key);
    mcq.push({ kind: "mcq", prompt, options, correct });
  }
  if (mcq.length < 9 || written.length < 1) return [];
  return [...mcq.slice(0, 9), written[0]];
}

export async function createInterviewQuestions(input: {
  apiKey: string;
  model: string;
  topicId: string;
  avoid: string[];
}) {
  const topic = await findTopic(input.topicId);
  const { brief } = await sourcePack(topic);
  const avoid = input.avoid
    .filter((item) => typeof item === "string")
    .map((item) => clip(item, 180))
    .slice(0, 30);
  const parsed = await complete(
    input.apiKey,
    input.model,
    [
      "You are an interviewer inside a lesson app.",
      "Return only JSON: {\"questions\":[{\"kind\":\"mcq\",\"prompt\":\"...\",\"options\":[\"...\",\"...\",\"...\",\"...\"],\"correct\":0},{\"kind\":\"written\",\"prompt\":\"...\"}]}",
      "Write exactly 9 mcq questions and 1 written question about SELECTED only. Put the written question last.",
      "Each mcq has exactly 4 short options and correct is the index 0, 1, 2, or 3. Only one option is right.",
      "The written question asks the student to explain a method or predict output in their own words. It has no options.",
      "Use LIBRARY NOTES and PUBLIC NOTES as the material. Write original questions. Do not copy sentences from PUBLIC NOTES.",
      "Each prompt is at most two sentences and under 180 characters. Each option is under 80 characters.",
      "Do not repeat any question listed in AVOID.",
    ].join("\n"),
    `${brief}\nAVOID\n${avoid.map((item) => `- ${item}`).join("\n") || "- none"}`,
    2400,
  );
  const drafts = questionsFrom(parsed);
  if (drafts.length < 10) throw new Error("The interviewer could not write a full set. Try again.");
  return {
    questions: drafts.map((question, index) => ({
      id: `q-${Date.now()}-${index}`,
      kind: question.kind,
      prompt: question.prompt,
      options: question.options,
      correct: question.correct,
    })),
  };
}

export async function explainInterviewQuestion(input: {
  apiKey: string;
  model: string;
  topicId: string;
  prompt: string;
}) {
  const topic = await findTopic(input.topicId);
  const { brief } = await sourcePack(topic);
  const parsed = await complete(
    input.apiKey,
    input.model,
    [
      "Answer one interview question for a student who is stuck.",
      "Return only JSON: {\"answer\":\"...\"}",
      "Write two short paragraphs in English, then one short paragraph in Hindi using English letters.",
      "Add one small code example only when it makes the answer clearer.",
      "Use LIBRARY NOTES and PUBLIC NOTES, but explain in your own words. Do not paste long quotations.",
    ].join("\n"),
    `${brief}\nQUESTION\n${clip(input.prompt, 900)}`,
    700,
  );
  const answer =
    parsed && typeof parsed === "object" && typeof (parsed as { answer?: unknown }).answer === "string"
      ? (parsed as { answer: string }).answer.trim()
      : "";
  if (answer.length < 20) throw new Error("The interviewer could not answer that question.");
  return { answer: answer.slice(0, 2000) };
}

export async function gradeInterviewAnswers(input: {
  apiKey: string;
  model: string;
  topicId: string;
  questions: Array<{
    id: string;
    prompt: string;
    answer: string;
    kind?: string;
    options?: string[];
    correct?: string;
  }>;
}) {
  const topic = await findTopic(input.topicId);
  const questions = input.questions.slice(0, 10).map((item) => ({
    id: String(item.id).slice(0, 40),
    prompt: clip(String(item.prompt ?? ""), 320),
    answer: clip(String(item.answer ?? ""), 1000),
    kind: item.kind === "mcq" ? "mcq" : "written",
    options: Array.isArray(item.options)
      ? item.options.filter((option): option is string => typeof option === "string").slice(0, 4)
      : [],
    correct: clip(String(item.correct ?? ""), 140),
  }));
  const scored = new Map<string, { score: number; note: string }>();
  for (const item of questions) {
    if (item.kind !== "mcq") continue;
    if (!item.answer) {
      scored.set(item.id, { score: 0, note: "No answer was submitted." });
      continue;
    }
    if (!item.options.includes(item.correct)) {
      scored.set(item.id, { score: 0, note: "This choice could not be checked." });
      continue;
    }
    scored.set(
      item.id,
      item.answer === item.correct
        ? { score: 10, note: "Correct." }
        : { score: 0, note: `The correct choice is ${item.correct}.` },
    );
  }
  const written = questions.filter((item) => item.kind !== "mcq");
  for (const item of written) {
    if (!item.answer) scored.set(item.id, { score: 0, note: "No answer was submitted." });
  }
  const answered = written.filter((item) => item.answer);

  if (answered.length > 0) {
    const lessons = topic.library.lessons.filter((lesson) => lesson.tabId === topic.tabId);
    const parsed = await complete(
      input.apiKey,
      input.model,
      [
        "Score interview answers.",
        "Return only JSON: {\"results\":[{\"id\":\"...\",\"score\":0,\"note\":\"one sentence\"}]}",
        "score is an integer from 0 to 10. 10 is a correct, specific answer. 5 is partly right. 0 is wrong or off topic.",
        "Judge against LIBRARY NOTES. note is one short sentence.",
        "Include every id you were given.",
      ].join("\n"),
      `SELECTED: ${topic.library.title} · ${topic.tabTitle}\nLIBRARY NOTES\n${lessonNotes(lessons)}\nANSWERS\n${JSON.stringify(answered)}`,
      900,
    );
    const results =
      parsed && typeof parsed === "object" && Array.isArray((parsed as { results?: unknown }).results)
        ? (parsed as { results: Array<{ id?: unknown; score?: unknown; note?: unknown }> }).results
        : [];
    for (const item of results) {
      if (typeof item.id !== "string") continue;
      const score = Math.max(0, Math.min(10, Math.round(Number(item.score) || 0)));
      const note = typeof item.note === "string" ? clip(item.note, 180) : "";
      scored.set(item.id, { score, note: note || "Scored." });
    }
  }

  const results = questions.map((item) => ({
    id: item.id,
    score: scored.get(item.id)?.score ?? 0,
    note: scored.get(item.id)?.note ?? "This answer could not be scored.",
  }));
  const total = results.reduce((sum, item) => sum + item.score, 0);
  return { results, total, max: results.length * 10 };
}
