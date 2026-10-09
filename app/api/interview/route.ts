import {
  createInterviewQuestions,
  explainInterviewQuestion,
  gradeInterviewAnswers,
} from "@/lib/interview/runInterview";
import { normalizeGroqKey } from "@/lib/groqKey";
import { readStoredGroqKeys } from "@/lib/groqStore";

export const dynamic = "force-dynamic";

async function apiKeyFrom(request: Request, record: Record<string, unknown>) {
  const bodyKey = typeof record.groqKey === "string" ? record.groqKey : "";
  const header = request.headers.get("x-groq-key") ?? "";
  const stored = (await readStoredGroqKeys()).selected;
  const env = process.env.GROQ_API_KEY ?? "";
  return [bodyKey, header, stored, env].map(normalizeGroqKey).find(Boolean) ?? "";
}

function modelFrom(request: Request) {
  const header = request.headers.get("x-groq-model")?.trim() ?? "";
  const fromEnv = process.env.GROQ_MODEL?.trim() ?? "";
  const candidate = /^[A-Za-z0-9_.:/-]{3,80}$/.test(header) ? header : fromEnv;
  return /^[A-Za-z0-9_.:/-]{3,80}$/.test(candidate) ? candidate : "openai/gpt-oss-20b";
}

function friendly(error: unknown) {
  const message = (error instanceof Error ? error.message : "The interviewer could not continue.").replace(
    /gsk_[A-Za-z0-9_-]+/g,
    "gsk_hidden",
  );
  if (/invalid api key|incorrect api key/i.test(message)) {
    return "Groq rejected the API key. Paste a free key from console.groq.com. It starts with gsk_.";
  }
  if (/rate|limit|429/i.test(message)) return "The free Groq limit was reached. Wait a minute and try again.";
  return message.slice(0, 240);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "The interview request could not be read." }, { status: 400 });
  }
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const apiKey = await apiKeyFrom(request, record);
  if (!apiKey) {
    return Response.json(
      { error: "Add a free Groq API key in Settings before starting an interview. It starts with gsk_." },
      { status: 400 },
    );
  }
  const topicId = typeof record.topicId === "string" ? record.topicId.slice(0, 200) : "";
  if (!topicId.includes(":")) {
    return Response.json({ error: "Choose a concept first." }, { status: 400 });
  }
  const model = modelFrom(request);

  try {
    if (record.action === "questions") {
      const avoid = Array.isArray(record.avoid)
        ? record.avoid.filter((item): item is string => typeof item === "string").slice(0, 30)
        : [];
      return Response.json(await createInterviewQuestions({ apiKey, model, topicId, avoid }));
    }
    if (record.action === "explain") {
      const prompt = typeof record.prompt === "string" ? record.prompt : "";
      if (!prompt.trim()) return Response.json({ error: "That question is empty." }, { status: 400 });
      return Response.json(await explainInterviewQuestion({ apiKey, model, topicId, prompt }));
    }
    if (record.action === "grade") {
      const questions = Array.isArray(record.questions) ? record.questions : null;
      if (!questions?.length) return Response.json({ error: "There are no answers to score." }, { status: 400 });
      const clean = questions
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((row) => ({
          id: typeof row.id === "string" ? row.id : "",
          prompt: typeof row.prompt === "string" ? row.prompt : "",
          answer: typeof row.answer === "string" ? row.answer : "",
          kind: row.kind === "mcq" ? "mcq" : "written",
          options: Array.isArray(row.options)
            ? row.options.filter((option): option is string => typeof option === "string").slice(0, 4)
            : [],
          correct: typeof row.correct === "string" ? row.correct : "",
        }))
        .filter((row) => row.id && row.prompt)
        .slice(0, 10);
      return Response.json(await gradeInterviewAnswers({ apiKey, model, topicId, questions: clean }));
    }
    return Response.json({ error: "That interview action is not available." }, { status: 400 });
  } catch (error) {
    const message = friendly(error);
    const status = message === "That concept is not in the library." ? 404 : 502;
    return Response.json({ error: message }, { status });
  }
}
