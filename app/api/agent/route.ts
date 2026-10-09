import { GroqError, runAgent, type AgentMessage } from "@/lib/agent/runAgent";
import { normalizeGroqKey } from "@/lib/groqKey";
import { readStoredGroqKeys } from "@/lib/groqStore";

export const dynamic = "force-dynamic";

async function apiKeysFrom(request: Request, record: Record<string, unknown>) {
  const bodyKey = typeof record.groqKey === "string" ? record.groqKey : "";
  const header = request.headers.get("x-groq-key") ?? "";
  const stored = (await readStoredGroqKeys()).selected;
  const env = process.env.GROQ_API_KEY ?? "";
  return [...new Set([bodyKey, header, stored, env].map(normalizeGroqKey).filter(Boolean))];
}

function modelFrom(request: Request, record: Record<string, unknown>) {
  const bodyModel = typeof record.groqModel === "string" ? record.groqModel.trim() : "";
  const header = request.headers.get("x-groq-model")?.trim() ?? "";
  const fromEnv = process.env.GROQ_MODEL?.trim() ?? "";
  const candidate = [bodyModel, header, fromEnv].find((item) => /^[A-Za-z0-9_.:/-]{3,80}$/.test(item)) ?? "";
  return candidate || "openai/gpt-oss-20b";
}

function messagesFrom(value: unknown): AgentMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) return null;
  const messages: AgentMessage[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const record = item as { role?: unknown; content?: unknown };
    if (record.role !== "user" && record.role !== "assistant") return null;
    if (typeof record.content !== "string") return null;
    const content = record.content.trim().slice(0, 2000);
    if (!content) return null;
    messages.push({ role: record.role, content });
  }
  if (messages.at(-1)?.role !== "user") return null;
  return messages;
}

export async function GET() {
  const stored = Boolean((await readStoredGroqKeys()).selected);
  const env = Boolean(process.env.GROQ_API_KEY?.trim());
  return Response.json({ configured: stored || env, env });
}

function friendly(error: unknown) {
  const status = error instanceof GroqError ? error.status : 0;
  const message = (error instanceof Error ? error.message : "The study agent could not answer.").replace(
    /gsk_[A-Za-z0-9_-]+/g,
    "gsk_hidden",
  );
  if (status === 401 || /invalid api key|incorrect api key/i.test(message)) {
    return "Groq rejected the API key. Paste a free key from console.groq.com. It starts with gsk_.";
  }
  if (status === 429 || /rate limit|too many requests/i.test(message)) {
    return "The free Groq limit was reached. Wait a minute and try again.";
  }
  return message.slice(0, 240);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "The chat message could not be read." }, { status: 400 });
  }
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const apiKeys = await apiKeysFrom(request, record);
  if (apiKeys.length === 0) {
    return Response.json(
      { error: "Add a free Groq API key to chat with the study agent. It starts with gsk_." },
      { status: 400 },
    );
  }
  const messages = messagesFrom(record.messages);
  if (!messages) {
    return Response.json({ error: "Send a chat message first." }, { status: 400 });
  }
  const pathname = typeof record.pathname === "string" ? record.pathname.slice(0, 200) : "/";
  const tab = typeof record.tab === "string" ? record.tab.slice(0, 120) : "";

  try {
    const result = await runAgent({
      apiKeys,
      model: modelFrom(request, record),
      messages,
      pathname,
      tab,
    });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: friendly(error) }, { status: 502 });
  }
}
