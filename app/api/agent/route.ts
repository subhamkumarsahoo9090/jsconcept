import { runAgent, type AgentMessage } from "@/lib/agent/runAgent";
import { readStoredGroqKeys } from "@/lib/groqStore";

export const dynamic = "force-dynamic";

async function apiKeyFrom(request: Request) {
  const header = request.headers.get("x-groq-key")?.trim() ?? "";
  if (header.length >= 20 && header.length <= 200 && !/[\r\n]/.test(header)) return header;
  const stored = (await readStoredGroqKeys()).selected;
  if (stored) return stored;
  return process.env.GROQ_API_KEY?.trim() ?? "";
}

function modelFrom(request: Request) {
  const header = request.headers.get("x-groq-model")?.trim() ?? "";
  const fromEnv = process.env.GROQ_MODEL?.trim() ?? "";
  const candidate = /^[A-Za-z0-9_.:/-]{3,80}$/.test(header) ? header : fromEnv;
  return /^[A-Za-z0-9_.:/-]{3,80}$/.test(candidate) ? candidate : "openai/gpt-oss-20b";
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

export async function POST(request: Request) {
  const apiKey = await apiKeyFrom(request);
  if (!apiKey) {
    return Response.json(
      { error: "Add a free Groq API key to chat with the study agent." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "The chat message could not be read." }, { status: 400 });
  }
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const messages = messagesFrom(record.messages);
  if (!messages) {
    return Response.json({ error: "Send a chat message first." }, { status: 400 });
  }
  const pathname = typeof record.pathname === "string" ? record.pathname.slice(0, 200) : "/";
  const tab = typeof record.tab === "string" ? record.tab.slice(0, 120) : "";

  try {
    const result = await runAgent({
      apiKey,
      model: modelFrom(request),
      messages,
      pathname,
      tab,
    });
    return Response.json(result);
  } catch (error) {
    const message = (error instanceof Error ? error.message : "The study agent could not answer.").replace(
      /gsk_[A-Za-z0-9_-]+/g,
      "gsk_hidden",
    );
    const friendly = /api key|invalid/i.test(message)
      ? "Groq rejected the API key. Paste a free key from console.groq.com."
      : /rate|limit|429/i.test(message)
        ? "The free Groq limit was reached. Wait a minute and try again."
        : message.slice(0, 240);
    return Response.json({ error: friendly }, { status: 502 });
  }
}
