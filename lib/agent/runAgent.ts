import "server-only";

import {
  cleanPath,
  currentScreen,
  describePage,
  loadLibraries,
  navigationCatalog,
  resolveAppPath,
} from "@/lib/agent/pages";
import type { Library } from "@/lib/libraryTypes";
import { createAgentLibrary, libraryNameFrom } from "@/lib/agent/createLibrary";
import {
  addAgentLine,
  conceptNameFrom,
  confirmNote,
  createAgentConcept,
  detachConcept,
  isNo,
  isYes,
  libraryFromContext,
  lineRequestFrom,
  mentionedConcept,
  pendingNote,
} from "@/lib/agent/editLibrary";
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
  createLibrary?: unknown;
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

export class GroqError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function groqMessage(payload: { error?: { message?: string } | string }, status: number) {
  if (typeof payload.error === "string" && payload.error.trim()) return payload.error.trim();
  if (payload.error && typeof payload.error === "object" && payload.error.message) {
    return payload.error.message;
  }
  if (status === 401) return "Invalid API key";
  return "Groq could not answer.";
}

function modelProblem(error: GroqError) {
  return error.status === 404 || /model|decommissioned|does not exist|not found/i.test(error.message);
}

async function requestGroq(apiKey: string, model: string, system: string, messages: AgentMessage[]) {
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
  if (response.status === 400 || response.status === 422) {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }
  const payload = (await response.json().catch(() => ({}))) as {
    error?: { message?: string } | string;
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  if (!response.ok) throw new GroqError(response.status, groqMessage(payload, response.status));
  return parseAgentJson(payload.choices?.[0]?.message?.content ?? "");
}

async function complete(apiKeys: string[], model: string, system: string, messages: AgentMessage[]) {
  const models = model === DEFAULT_MODEL ? [model] : [model, DEFAULT_MODEL];
  let lastError: GroqError | null = null;
  for (const apiKey of apiKeys) {
    for (const chosen of models) {
      try {
        return await requestGroq(apiKey, chosen, system, messages);
      } catch (error) {
        if (!(error instanceof GroqError)) throw error;
        lastError = error;
        if (error.status === 401) break;
        if (!modelProblem(error)) throw error;
      }
    }
  }
  throw lastError ?? new GroqError(502, "Groq could not answer.");
}

function instructions(catalog: string, page: string, screen: string, locked: string) {
  return [
    "You are the study agent inside this lesson app. Reply in the language the student used. Hindi may be written in English letters.",
    "CURRENT SCREEN is the page open right now. If the student asks where they are, answer only from CURRENT SCREEN.",
    "Never say a note, concept, or library was saved or created. The app does that itself.",
    "Return only a JSON object with keys reply, navigate, search, saveNote, and createLibrary.",
    "createLibrary is null unless the student asks to create a library. Then set it to the library name only, such as my notes, and set navigate to null.",
    "reply is the chat text. When navigate is set, reply is only one short sentence, such as Opened Node.js. Do not copy the lesson into the chat, because the page already shows it.",
    "When navigate is null and the student asks about the open page, explain from PAGE in short paragraphs with one small example.",
    "navigate is an exact path from NAV, or null. For a concept use /dashboard/slug?tab=TAB_ID.",
    "search is a short public-web query, or null. Set it only after the student says the page explanation was not enough.",
    "saveNote stays null. Do not save a note from this reply. If the student did not name a concept, the app asks them to confirm the open concept.",
    "Teach from PAGE first. Do not claim the page says something that is not in PAGE.",
    "When search results are supplied later, explain them in your own words, give two different examples, and include the source links. Do not paste long quotations.",
    locked,
    "CURRENT SCREEN",
    screen,
    "NAV",
    catalog,
    "PAGE",
    page,
  ].join("\n");
}

export async function runAgent(input: {
  apiKeys: string[];
  model: string;
  messages: AgentMessage[];
  pathname: string;
  tab: string;
}) {
  const libraries = await loadLibraries();
  const catalog = navigationCatalog(libraries);
  const page = describePage(libraries, input.pathname, input.tab);
  const screen = currentScreen(libraries, input.pathname, input.tab);
  const screenText = screen.library
    ? `Library: ${screen.library.title}\nConcept: ${screen.concept?.title ?? "none"}`
    : screen.label;
  const history = input.messages.slice(-8);
  const model = input.model || DEFAULT_MODEL;
  const lastUserEarly = [...history].reverse().find((message) => message.role === "user");
  const previousAssistant = [...history].reverse().find((message) => message.role === "assistant");
  const pending = previousAssistant ? pendingNote(previousAssistant.content) : null;
  const freshRequest = lastUserEarly
    ? lineRequestFrom(lastUserEarly.content).asked ||
      libraryNameFrom(lastUserEarly.content).asked ||
      conceptNameFrom(lastUserEarly.content).asked
    : false;
  if (pending && lastUserEarly && !freshRequest) {
    const library = libraries.find(
      (item) => item.title.toLowerCase() === pending.libraryTitle.toLowerCase(),
    );
    const typed = lastUserEarly.content.trim().replace(/^(?:concept|tab)\s+/i, "");
    const namedTab = library?.tabs.find((tab) => tab.title.toLowerCase() === typed.toLowerCase());
    const answering =
      isYes(lastUserEarly.content) ||
      isNo(lastUserEarly.content) ||
      Boolean(namedTab) ||
      typed.split(/\s+/).filter(Boolean).length <= 2;
    if (library && answering) {
    if (isNo(lastUserEarly.content)) {
      return { reply: "Okay. I did not write the note.", navigate: null, saved: null };
    }
    const chosen = isYes(lastUserEarly.content)
      ? library.tabs.find((tab) => tab.title.toLowerCase() === pending.conceptTitle.toLowerCase())
      : namedTab;
    if (!chosen) {
      const names = library.tabs.map((tab) => tab.title).join(", ");
      return {
        reply: `That concept is not in ${library.title}. Concepts: ${names}.\n\n${confirmNote(library.title, pending.conceptTitle, pending.line)}`,
        navigate: null,
        saved: null,
      };
    }
    const line = await addAgentLine(library.id, chosen.title, pending.line);
    if (!line.ok) return { reply: line.error, navigate: null, saved: null };
    return {
      reply: line.added
        ? `Added "${line.line}" inside ${line.title}.`
        : `"${line.line}" is already inside ${line.title}.`,
      navigate: line.path,
      saved: { library: line.library, tab: line.title, path: line.path },
    };
    }
  }
  const namedLibrary = lastUserEarly ? libraryNameFrom(lastUserEarly.content) : { asked: false, title: "" };
  if (namedLibrary.asked) {
    if (!namedLibrary.title) {
      return {
        reply: "Tell me the library name. For example: create a library named my notes.",
        navigate: null,
        saved: null,
      };
    }
    const created = await createAgentLibrary(namedLibrary.title);
    if (!created.ok) {
      return { reply: created.error, navigate: null, saved: null };
    }
    return {
      reply: created.created
        ? `Created the library ${created.title}.`
        : `The library ${created.title} is already there, so I opened it.`,
      navigate: created.path,
      saved: { library: created.title, tab: "Basics", path: created.path },
    };
  }
  if (lastUserEarly) {
    const conceptRequest = conceptNameFrom(lastUserEarly.content);
    const lineRequest = lineRequestFrom(lastUserEarly.content);
    if (conceptRequest.asked || lineRequest.asked) {
      const library =
        lineRequest.asked && !conceptRequest.asked
          ? screen.library
          : libraryFromContext(libraries, input.pathname, history);
      if (!library) {
        return {
          reply: lineRequest.asked
            ? `You are on ${screen.label}. Open the library and concept where the note should go, or tell me the library and concept.`
            : "Open a library first, or create one. For example: create a library named my notes.",
          navigate: null,
          saved: null,
        };
      }
      if (conceptRequest.asked && !lineRequest.asked) {
        if (!conceptRequest.title) {
          return {
            reply: "Tell me the concept name. For example: create a concept important.",
            navigate: null,
            saved: null,
          };
        }
        const concept = await createAgentConcept(library.id, conceptRequest.title);
        if (!concept.ok) return { reply: concept.error, navigate: null, saved: null };
        return {
          reply: concept.created
            ? `Created the concept ${concept.title}.`
            : `The concept ${concept.title} is already there, so I opened it.`,
          navigate: concept.path,
          saved: { library: concept.library, tab: concept.title, path: concept.path },
        };
      }
      const placed = detachConcept(lineRequest.line, library);
      const explicit =
        lineRequest.concept || placed.concept || mentionedConcept(lastUserEarly.content, library);
      let noteText = placed.line;
      if (!noteText) {
        const earlier = [...history]
          .reverse()
          .find((message) => message.role === "assistant" && !pendingNote(message.content));
        noteText = earlier?.content.replace(/\s+/g, " ").trim().slice(0, 500) ?? "";
      }
      if (!noteText) {
        return {
          reply: "Tell me the note text. For example: add a note i love my india.",
          navigate: null,
          saved: null,
        };
      }
      if (!explicit) {
        const openConcept = screen.library?.id === library.id ? screen.concept : null;
        if (!openConcept) {
          return {
            reply: `You are on ${library.title}. Tell me which concept should get the note.`,
            navigate: null,
            saved: null,
          };
        }
        return {
          reply: confirmNote(library.title, openConcept.title, noteText),
          navigate: null,
          saved: null,
        };
      }
      const line = await addAgentLine(library.id, explicit, noteText);
      if (!line.ok) return { reply: line.error, navigate: null, saved: null };
      const reply = line.added
        ? `Added "${line.line}" inside ${line.title}.`
        : `"${line.line}" is already inside ${line.title}.`;
      return {
        reply,
        navigate: line.path,
        saved: { library: line.library, tab: line.title, path: line.path },
      };
    }
  }
  const first = await complete(
    input.apiKeys,
    model,
    instructions(catalog, page, screenText, "You may set navigate or search on this turn."),
    history,
  );

  const modelLibraryName = asText(first.createLibrary);
  if (modelLibraryName) {
    const created = await createAgentLibrary(modelLibraryName);
    if (!created.ok) {
      return { reply: created.error, navigate: null, saved: null };
    }
    return {
      reply: created.created
        ? `Created the library ${created.title}.`
        : `The library ${created.title} is already there, so I opened it.`,
      navigate: created.path,
      saved: { library: created.title, tab: "Basics", path: created.path },
    };
  }

  const requested = asText(first.navigate);
  const destination = requested ? resolveAppPath(libraries, requested) : null;
  let parsed = first;
  let navigate = destination;

  if (asText(first.search) && !destination) {
    const sources = await searchOpenSources(asText(first.search));
    parsed = await complete(
      input.apiKeys,
      model,
      instructions(
        catalog,
        page,
        screenText,
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
  const namedConcept = screen.library ? mentionedConcept(lastUser?.content ?? "", screen.library) : "";
  if (lastUser && wantsNote(lastUser.content) && !namedConcept) {
    const noteText = (asText(note?.english) || previousAnswer?.content || lastUser.content)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);
    if (screen.library && screen.concept && noteText) {
      return {
        reply: confirmNote(screen.library.title, screen.concept.title, noteText),
        navigate: null,
        saved: null,
      };
    }
    reply = `You are on ${screen.label}. Open a library concept, or tell me the concept name, before I write the note.`;
    navigate = null;
  } else if (lastUser && wantsNote(lastUser.content) && note && anchor && namedConcept) {
    const result = await saveStudyNote({
      ...note,
      librarySlug: anchor.librarySlug,
      tabTitle: namedConcept,
      afterLessonId: anchor.afterLessonId,
    });
    if (result.ok) {
      saved = { library: result.library, tab: result.tab, path: result.path };
      reply = `Saved the note in ${result.library}, ${result.tab}.`;
      navigate = result.path;
    } else {
      reply = `I could not save the note. ${result.error}`;
    }
  }
  if (reply.trim().startsWith("{")) {
    reply = saved ? `Saved the note below ${anchor?.lessonTitle ?? "the lesson"}.` : "Ask me again in a short sentence.";
  }

  return { reply: reply.trim(), navigate, saved };
}
