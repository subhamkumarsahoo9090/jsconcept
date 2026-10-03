"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { primaryButtonClass } from "@/components/ui/classes";
import { onGroqKeyChange, readGroqKey, readGroqModel } from "@/lib/groqKey";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const SESSION_KEY = "jsexport.agent";

function visibleReply(reply: string, navigated: boolean) {
  const trimmed = reply.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as { reply?: unknown };
      if (typeof parsed.reply === "string" && parsed.reply.trim() && !navigated) {
        return parsed.reply.trim();
      }
    } catch {
      return navigated ? "Opened that page." : reply;
    }
  }
  if (navigated && trimmed.length > 180) return "Opened that page.";
  return reply;
}

function readSession() {
  if (typeof window === "undefined") {
    return { active: false, messages: [] as ChatMessage[] };
  }
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return { active: false, messages: [] as ChatMessage[] };
    const parsed = JSON.parse(raw) as { active?: unknown; messages?: unknown };
    const messages = Array.isArray(parsed.messages)
      ? parsed.messages.filter(
          (item): item is ChatMessage =>
            !!item &&
            typeof item === "object" &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string",
        )
      : [];
    return { active: parsed.active === true, messages };
  } catch {
    return { active: false, messages: [] as ChatMessage[] };
  }
}

export default function StudyAgent() {
  const pathname = usePathname();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [active, setActive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [serverKey, setServerKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = readSession();
    setActive(stored.active);
    setMessages(stored.messages);
    setApiKey(readGroqKey());
    setModel(readGroqModel());
    setHydrated(true);
    return onGroqKeyChange(() => {
      setApiKey(readGroqKey());
      setModel(readGroqModel());
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ active, messages: messages.slice(-40) }),
    );
  }, [active, hydrated, messages]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    fetch("/api/agent")
      .then((response) => response.json())
      .then((data: { configured?: boolean }) => {
        if (!cancelled) setServerKey(data.configured === true);
      })
      .catch(() => {
        if (!cancelled) setServerKey(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, pending]);

  function deactivate() {
    setActive(false);
    setPending(false);
  }

  async function runTurn(prior: ChatMessage[], content: string) {
    if (content.toLowerCase() === "clear") {
      setMessages([]);
      setDraft("");
      setEditDraft("");
      setEditingIndex(null);
      setError("");
      return;
    }
    const history = [...prior, { role: "user" as const, content }];
    setMessages(history);
    setDraft("");
    setEditDraft("");
    setEditingIndex(null);
    setError("");
    setPending(true);
    try {
      const tab = new URLSearchParams(window.location.search).get("tab") ?? "";
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-groq-key": apiKey } : {}),
          ...(model ? { "x-groq-model": model } : {}),
        },
        body: JSON.stringify({ messages: history.slice(-12), pathname, tab }),
      });
      const data = (await response.json()) as {
        error?: string;
        reply?: string;
        navigate?: string | null;
        saved?: { path?: string } | null;
      };
      if (!response.ok || !data.reply) {
        setError(data.error || "The study agent could not answer.");
        return;
      }
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: visibleReply(data.reply!, Boolean(data.navigate)),
        },
      ]);
      if (data.navigate) router.push(data.navigate);
      if (data.saved) router.refresh();
    } catch {
      setError("The study agent could not reach Groq.");
    } finally {
      setPending(false);
    }
  }

  function send(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || pending) return;
    void runTurn(messages, content);
  }

  function sendEdit() {
    if (editingIndex === null || pending) return;
    const content = editDraft.trim();
    if (!content) return;
    void runTurn(messages.slice(0, editingIndex), content);
  }

  if (!hydrated) return null;

  if (!active) {
    return (
      <button
        type="button"
        className={`${primaryButtonClass} fixed right-4 bottom-4 z-40 shadow-lg`}
        onClick={() => setActive(true)}
      >
        Study agent
      </button>
    );
  }

  const needsKey = !serverKey && !apiKey;

  return (
    <section className="fixed right-4 bottom-4 z-40 flex h-[min(34rem,calc(100%-5rem))] w-[min(24rem,calc(100%-2rem))] flex-col overflow-hidden rounded-3xl border border-border bg-background text-foreground shadow-xl">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Study agent</h2>
          <p className="text-xs text-muted">Stays open while you change pages</p>
        </div>
        <button
          type="button"
          className="rounded-full px-3 py-1.5 text-sm text-muted hover:bg-surface"
          onClick={deactivate}
        >
          Deactivate
        </button>
      </header>
      {needsKey ? (
        <p className="border-b border-border px-4 py-3 text-sm text-muted">
          Add a Groq API key in{" "}
          <Link href="/dashboard/settings" className="font-medium text-primary hover:underline">
            Settings
          </Link>
          .
        </p>
      ) : null}
      <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted">
            Ask me to explain this page, open another lesson, or save our chat as a note in that concept.
          </p>
        ) : (
          messages.map((message, index) =>
            message.role === "user" && editingIndex === index ? (
              <div key={`${message.role}-${index}`} className="ml-auto w-full max-w-[95%]">
                <textarea
                  value={editDraft}
                  onChange={(event) => setEditDraft(event.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <div className="mt-1 flex justify-end gap-1">
                  <button
                    type="button"
                    className="rounded-full px-3 py-1 text-sm text-muted hover:bg-surface"
                    onClick={() => setEditingIndex(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-full px-3 py-1 text-sm font-medium text-primary hover:bg-surface"
                    onClick={sendEdit}
                  >
                    Send
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[95%] ${message.role === "user" ? "ml-auto" : ""}`}
              >
                <p
                  className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    message.role === "user"
                      ? "bg-primary text-button-text"
                      : "bg-surface text-foreground"
                  }`}
                >
                  {message.content}
                </p>
                {message.role === "user" && !pending ? (
                  <button
                    type="button"
                    className="mt-1 px-1 text-xs font-medium text-primary hover:underline"
                    onClick={() => {
                      setEditingIndex(index);
                      setEditDraft(message.content);
                    }}
                  >
                    Edit
                  </button>
                ) : null}
              </div>
            ),
          )
        )}
        {pending ? <p className="text-sm text-muted">Reading and answering...</p> : null}
      </div>
      {error ? (
        <p className="px-4 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <form className="flex gap-2 border-t border-border p-3" onSubmit={send}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about this page"
          disabled={needsKey || pending}
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button type="submit" disabled={needsKey || pending} className={primaryButtonClass}>
          Send
        </button>
      </form>
    </section>
  );
}
