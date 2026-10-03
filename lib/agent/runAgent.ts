import "server-only";

import {
  cleanPath,
  describePage,
  loadLibraries,
  navigationCatalog,
  resolveAppPath,
} from "@/lib/agent/pages";
import type { Library } from "@/lib/libraryTypes";
import { saveStudyNote, type NoteInput } from "@/lib/agent/saveNote";
import { searchOpenSources } from "@/lib/agent/search";

export type AgentMessage = {
  role: "user" | "assistant";
  content: string;
};

type AgentJson = {
  reply?: unknown;
  navigate?: unknown;
  search?: unknown;
  saveNote?: NoteInput | null;
};

const DEFAULT_MODEL = "openai/gpt-oss-20b";

function parseAgentJson(text: string): AgentJson {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return { reply: text.trim() };
  try {
    return JSON.parse(raw.slice(start, end + 1)) as AgentJson;
  } catch {
    return { reply: text.trim() };
  }
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function chatText(value: unknown) {
  const text = asText(value);
  if (!text.startsWith("{")) return text;
  const inner = asText(parseAgentJson(text).reply);
  if (!inner || inner === text) return text;
  return inner.startsWith("{") ? asText(parseAgentJson(inner).reply) || inner : inner;
}

function wantsNote(text: string) {
  return (
    /\b(note|save)\b/i.test(text) ||
    /\b(add|rakh|daal|dal)\b[\s\S]{0,40}\b(below|bellow|under|niche|lesson)\b/i.test(text)
  );
}

function noteFromMessage(content: string, lessonTitle: string): NoteInput {
  const fences = [...content.matchAll(/```(?:\w+)?\n?([\s\S]*?)```/g)].map((match) =>
    match[1].trim(),
  );
  const prose = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\*\*/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const paragraphs = prose
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\n/g, " ").trim())
    .filter(Boolean)
    .slice(0, 6);
  const body = paragraphs.length > 0 ? paragraphs : [prose.slice(0, 800)];
  return {
    title: `How to use ${lessonTitle}`.slice(0, 120),
    english: body.join("\n\n"),
    hindi: body.join("\n\n"),
    code: fences.join("\n\n"),
  };
}

function findAnchor(
  libraries: Library[],
  pathname: string,
  tab: string,
  history: AgentMessage[],
  userText: string,
) {
  const parsed = cleanPath(pathname);
  const slug =
    parsed?.pathname.startsWith("/dashboard/")
      ? decodeURIComponent(parsed.pathname.slice("/dashboard/".length))
      : "";
  const library =
    libraries.find((item) => item.slug === slug) ??
    libraries.find((item) => item.slug === "node-js");
  if (!library) return null;
  const blob = `${userText}\n${history.map((message) => message.content).join("\n")}`.toLowerCase();
  const mentioned = library.lessons
    .filter((lesson) => lesson.title.length > 3 && blob.includes(lesson.title.toLowerCase()))
    .sort((left, right) => right.title.length - left.title.length)[0];
  const activeTab = library.tabs.find(
    (item) => item.id === tab || item.title.toLowerCase() === tab.toLowerCase(),
  );
  const scoped = library.lessons.filter((lesson) => !activeTab || lesson.tabId === activeTab.id);
  const lessonNumber = Number(userText.match(/lesson\s+(\d+)/i)?.[1] ?? "");
  const numbered = lessonNumber ? scoped[lessonNumber - 1] : undefined;
  const lesson = mentioned ?? numbered;
  if (!lesson) return null;
  const tabItem = library.tabs.find((item) => item.id === lesson.tabId);
  return {
    librarySlug: library.slug,
    tabTitle: tabItem?.title ?? lesson.title,
    afterLessonId: lesson.id,
    lessonTitle: lesson.title,
  };
}

function openedLabel(libraries: Library[], destination: string) {
  const parsed = cleanPath(destination);
  if (!parsed) return "that page";
  if (parsed.pathname === "/") return "Home";
  if (parsed.pathname === "/login") return "Log in";
  if (parsed.pathname === "/dashboard") return "All libraries";
  const slug = decodeURIComponent(parsed.pathname.slice("/dashboard/".length));
  const library = libraries.find((item) => item.slug === slug);
  if (!library) return "that page";
  const tab = library.tabs.find(
    (item) =>
      item.id === parsed.tab || item.title.toLowerCase() === parsed.tab.toLowerCase(),
  );
  return tab ? `${library.title}, ${tab.title}` : library.title;
}

async function complete(
  apiKey: string,
  model: string,
  system: string,
  messages: AgentMessage[],
) {
  const body = {
    model,
    temperature: 0.3,
    max_tokens: 900,
    messages: [{ role: "system", content: system }, ...messages],
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
  if (!response.ok) {
    const message = payload.error?.message || "Groq could not answer.";
    throw new Error(message);
  }
  return parseAgentJson(payload.choices?.[0]?.message?.content ?? "");
}

function instructions(catalog: string, page: string, locked: string) {
  return [
    "You are the study agent inside this lesson app. Reply in the language the student used. Hindi may be written in English letters.",
    "Return only a JSON object with keys reply, navigate, search, and saveNote.",
    "reply is the chat text. When navigate is set, reply is only one short sentence, such as Opened Node.js. Do not copy the lesson into the chat, because the page already shows it.",
    "When navigate is null and the student asks about the open page, explain from PAGE in short paragraphs with one small example.",
    "navigate is an exact path from NAV, or null. For a concept use /dashboard/slug?tab=TAB_ID.",
    "search is a short public-web query, or null. Set it only after the student says the page explanation was not enough.",
    "saveNote is null unless the student asks to save a note. Then set librarySlug, tabTitle, and a short title. Keep english and hindi to two short paragraphs. Put one short example in code. reply must be one sentence, never the note itself and never JSON.",
    "Teach from PAGE first. Do not claim the page says something that is not in PAGE.",
    "When search results are supplied later, explain them in your own words, give two different examples, and include the source links. Do not paste long quotations.",
    locked,
    "NAV",
    catalog,
    "PAGE",
    page,
  ].join("\n");
}

export async function runAgent(input: {
  apiKey: string;
  model: string;
  messages: AgentMessage[];
  pathname: string;
  tab: string;
}) {
  const libraries = await loadLibraries();
  const catalog = navigationCatalog(libraries);
  const page = describePage(libraries, input.pathname, input.tab);
  const history = input.messages.slice(-8);
  const model = input.model || DEFAULT_MODEL;
  const first = await complete(
    input.apiKey,
    model,
    instructions(catalog, page, "You may set navigate or search on this turn."),
    history,
  );

  const requested = asText(first.navigate);
  const destination = requested ? resolveAppPath(libraries, requested) : null;
  let parsed = first;
  let navigate = destination;

  if (asText(first.search) && !destination) {
    const sources = await searchOpenSources(asText(first.search));
    parsed = await complete(
      input.apiKey,
      model,
      instructions(
        catalog,
        page,
        `Do not set search or navigate. Open references:\n${sources}`,
      ),
      history,
    );
  }

  let reply = destination
    ? `Opened ${openedLabel(libraries, destination)}.`
    : chatText(parsed.reply) || chatText(first.reply) || "I could not read a reply.";
  if (requested && !destination) {
    reply = `${reply}\n\nI can only open lesson pages that are already in this app.`;
    navigate = null;
  }

  const lastUser = [...history].reverse().find((message) => message.role === "user");
  const anchor = lastUser
    ? findAnchor(libraries, input.pathname, input.tab, history, lastUser.content)
    : null;
  const previousAnswer = [...history]
    .reverse()
    .find((message) => message.role === "assistant" && !message.content.trim().startsWith("{"));
  const modelNote = parsed.saveNote ?? first.saveNote;
  const builtNote =
    anchor && previousAnswer ? noteFromMessage(previousAnswer.content, anchor.lessonTitle) : null;
  const note =
    modelNote && asText(modelNote.english) && asText(modelNote.hindi) && asText(modelNote.title)
      ? modelNote
      : builtNote;
  let saved: { library: string; tab: string; path: string } | null = null;
  if (lastUser && wantsNote(lastUser.content) && note && anchor) {
    const result = await saveStudyNote({
      ...note,
      librarySlug: anchor.librarySlug,
      tabTitle: anchor.tabTitle,
      afterLessonId: anchor.afterLessonId,
    });
    if (result.ok) {
      saved = { library: result.library, tab: result.tab, path: result.path };
      reply = `Saved the note below ${anchor.lessonTitle}.`;
      navigate = result.path;
    } else {
      reply = `I could not save the note. ${result.error}`;
    }
  } else if (note && typeof note === "object" && asText(note.title) && !destination) {
    const result = await saveStudyNote(note);
    if (result.ok) {
      saved = { library: result.library, tab: result.tab, path: result.path };
      reply = `Saved the note in ${result.library}, ${result.tab}.`;
      navigate = result.path;
    }
  }
  if (reply.trim().startsWith("{")) {
    reply = saved ? `Saved the note below ${anchor?.lessonTitle ?? "the lesson"}.` : "Ask me again in a short sentence.";
  }

  return { reply: reply.trim(), navigate, saved };
}
