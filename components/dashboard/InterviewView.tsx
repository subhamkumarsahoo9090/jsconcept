"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import LibraryForm from "@/components/dashboard/LibraryForm";
import { useLibraryBar } from "@/components/layout/DashboardShell";
import {
  errorClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/classes";
import { mergeHistory, readHistory, readSession, writeSession } from "@/lib/interview/storage";
import type { HistoryEntry, InterviewTopic, QuizQuestion, QuizSession } from "@/lib/interview/types";
import { readGroqKey, readGroqModel } from "@/lib/groqKey";
import { useEditMode } from "@/lib/editMode";
import type { Library } from "@/lib/libraryTypes";

function historyFrom(topic: InterviewTopic, session: QuizSession): HistoryEntry[] {
  return session.questions.map((question, index) => ({
    id: question.id,
    roundId: session.roundId,
    topicId: topic.id,
    topicLabel: topic.label,
    prompt: question.prompt,
    kind: question.kind,
    options: question.options,
    correct: question.correct,
    answer: question.answer,
    aiAnswer: question.aiAnswer,
    score: question.score,
    note: question.note,
    askedAt: session.startedAt + index,
  }));
}

function avoidPrompts(topicId: string, session: QuizSession | null) {
  const saved = readHistory()
    .filter((entry) => entry.topicId === topicId)
    .map((entry) => entry.prompt);
  const current =
    session?.topicId === topicId ? session.questions.map((question) => question.prompt) : [];
  return [...new Set([...current, ...saved])].slice(-30);
}

export default function InterviewView({
  category,
  topics,
}: {
  category: Library;
  topics: InterviewTopic[];
}) {
  const [editing, setEditing] = useState(false);
  const canEdit = useEditMode();
  const [topicId, setTopicId] = useState("");
  const [session, setSession] = useState<QuizSession | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [askingId, setAskingId] = useState("");
  const [error, setError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);
  const loadingRef = useRef(false);
  const sessionRef = useRef<QuizSession | null>(null);
  sessionRef.current = session;
  const topic = topics.find((item) => item.id === topicId) ?? null;
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? topics.filter((item) => item.label.toLowerCase().includes(needle))
    : topics;

  const libraryBar = useMemo(
    () => ({
      id: category.id,
      title: category.title,
      summary: category.summary,
      accent: category.accent,
      slug: category.slug,
      editing,
      onToggleEdit: () => setEditing((current) => !current),
    }),
    [category.id, category.title, category.summary, category.accent, category.slug, editing],
  );
  useLibraryBar(libraryBar);

  useEffect(() => {
    if (!canEdit) setEditing(false);
  }, [canEdit]);

  useEffect(() => {
    const savedHistory = readHistory();
    setHistory(savedHistory);
    const saved = readSession();
    if (!saved || !topics.some((item) => item.id === saved.topicId)) return;
    setTopicId(saved.topicId);
    setSession(saved);
  }, [topics]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function keep(nextTopic: InterviewTopic, nextSession: QuizSession) {
    writeSession(nextSession);
    setSession(nextSession);
    setTopicId(nextTopic.id);
    setHistory(mergeHistory(historyFrom(nextTopic, nextSession)));
  }

  async function post(body: Record<string, unknown>) {
    const apiKey = readGroqKey();
    const model = readGroqModel();
    const response = await fetch("/api/interview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "x-groq-key": apiKey } : {}),
        ...(model ? { "x-groq-model": model } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(data.error || "The interviewer could not continue.");
    return data;
  }

  async function loadQuestions(nextTopic: InterviewTopic) {
    if (loadingRef.current) return;
    const ticket = ++requestId.current;
    loadingRef.current = true;
    setError("");
    setShowHistory(false);
    setTopicId(nextTopic.id);
    setLoading(true);
    setOpen(false);
    setQuery("");
    try {
      const data = (await post({
        action: "questions",
        topicId: nextTopic.id,
        avoid: avoidPrompts(nextTopic.id, session),
      })) as {
        questions?: Array<{
          id: string;
          kind?: string;
          prompt: string;
          options?: string[];
          correct?: string;
        }>;
      };
      if (ticket !== requestId.current) return;
      const questions: QuizQuestion[] = (data.questions ?? []).map((question) => ({
        id: question.id,
        kind: question.kind === "written" ? "written" : "mcq",
        prompt: question.prompt,
        options: Array.isArray(question.options) ? question.options : [],
        correct: question.correct ?? "",
        answer: "",
        aiAnswer: "",
        score: null,
        note: "",
      }));
      if (questions.length === 0) throw new Error("The interviewer did not send any questions.");
      keep(nextTopic, {
        topicId: nextTopic.id,
        roundId: crypto.randomUUID(),
        startedAt: Date.now(),
        questions,
        scored: false,
        total: 0,
        max: questions.length * 10,
      });
    } catch (caught) {
      if (ticket !== requestId.current) return;
      setError(caught instanceof Error ? caught.message : "The interviewer could not continue.");
    } finally {
      if (ticket === requestId.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }

  function updateAnswer(id: string, answer: string) {
    if (!session || !topic || session.scored) return;
    const next = {
      ...session,
      questions: session.questions.map((question) =>
        question.id === id ? { ...question, answer } : question,
      ),
    };
    keep(topic, next);
  }

  async function askAi(question: QuizQuestion) {
    if (!topic || askingId) return;
    setError("");
    setAskingId(question.id);
    try {
      const data = (await post({
        action: "explain",
        topicId: topic.id,
        prompt:
          question.kind === "mcq"
            ? `${question.prompt}\nChoices:\n${question.options
                .map((option, optionIndex) => `${["A", "B", "C", "D"][optionIndex]}. ${option}`)
                .join("\n")}`
            : question.prompt,
      })) as { answer?: string };
      const current = sessionRef.current;
      if (!current || current.topicId !== topic.id) return;
      keep(topic, {
        ...current,
        questions: current.questions.map((item) =>
          item.id === question.id ? { ...item, aiAnswer: data.answer ?? "" } : item,
        ),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The interviewer could not answer.");
    } finally {
      setAskingId("");
    }
  }

  async function seeScore() {
    if (!session || !topic || scoring || session.scored) return;
    setError("");
    setScoring(true);
    try {
      const data = (await post({
        action: "grade",
        topicId: topic.id,
        questions: session.questions.map((question) => ({
          id: question.id,
          prompt: question.prompt,
          answer: question.answer,
          kind: question.kind,
          options: question.options,
          correct: question.correct,
        })),
      })) as {
        results?: Array<{ id: string; score: number; note: string }>;
        total?: number;
        max?: number;
      };
      const current = sessionRef.current ?? session;
      if (current.topicId !== topic.id) return;
      const byId = new Map((data.results ?? []).map((result) => [result.id, result]));
      const questions = current.questions.map((question) => {
        const result = byId.get(question.id);
        return result ? { ...question, score: result.score, note: result.note } : question;
      });
      const total = questions.reduce((sum, question) => sum + (question.score ?? 0), 0);
      keep(topic, {
        ...current,
        scored: true,
        total,
        max: questions.length * 10,
        questions,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The score could not be calculated.");
    } finally {
      setScoring(false);
    }
  }

  const rounds = [...history.reduce((groups, entry) => {
    const group = groups.get(entry.roundId) ?? [];
    group.push(entry);
    groups.set(entry.roundId, group);
    return groups;
  }, new Map<string, HistoryEntry[]>())].sort(
    (a, b) => Math.max(...b[1].map((entry) => entry.askedAt)) - Math.max(...a[1].map((entry) => entry.askedAt)),
  );

  return (
    <div className="w-full">
      {canEdit && editing ? (
        <div className="mt-6 rounded-3xl border border-border bg-background p-5">
          <LibraryForm
            library={category}
            submitLabel="Save library"
            onDone={() => setEditing(false)}
          />
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <div ref={menuRef} className="relative min-w-0 flex-1">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-left text-sm"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            <span className="truncate font-medium">{topic?.label ?? "Choose a concept"}</span>
            <span className="shrink-0 text-xs text-muted">{open ? "Close" : "Search"}</span>
          </button>
          {open ? (
            <div className="absolute z-20 mt-2 w-full rounded-2xl border border-border bg-background p-2 shadow-xl">
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search concepts"
                aria-label="Search concepts"
                className={inputClass}
              />
              <ul role="listbox" aria-label="Concepts" className="mt-2 max-h-60 overflow-y-auto">
                {matches.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted">No matching concepts</li>
                ) : (
                  matches.map((item) => {
                    const selected = item.id === topic?.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                            selected ? "bg-surface font-medium text-primary" : "hover:bg-surface"
                          }`}
                          onClick={() => {
                            setOpen(false);
                            setQuery("");
                            setShowHistory(false);
                            if (sessionRef.current?.topicId === item.id) {
                              setTopicId(item.id);
                              return;
                            }
                            void loadQuestions(item);
                          }}
                        >
                          {item.label}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:bg-surface ${
            showHistory ? "bg-surface" : ""
          }`}
          onClick={() => setShowHistory((current) => !current)}
        >
          History
        </button>
      </div>

      {error ? (
        <p className={`${errorClass} mt-4`} role="alert">
          {error}{" "}
          {/settings|api key/i.test(error) ? (
            <Link href="/dashboard/settings" className="underline">
              Open Settings
            </Link>
          ) : null}
        </p>
      ) : null}

      {showHistory ? (
        <div className="mt-6 flex flex-col gap-6">
          {rounds.length === 0 ? (
            <p className="text-sm text-muted">
              No questions yet. Choose a concept to start a round of 9 multiple-choice questions and 1 written question.
            </p>
          ) : (
            rounds.map(([roundId, entries]) => {
              const ordered = [...entries].sort((a, b) => a.askedAt - b.askedAt);
              const scored = ordered.some((entry) => entry.score !== null);
              const total = ordered.reduce((sum, entry) => sum + (entry.score ?? 0), 0);
              return (
                <section key={roundId} className="rounded-3xl border border-border bg-background p-5 shadow-sm">
                  <h2 className="text-base font-semibold">{ordered[0]?.topicLabel}</h2>
                  {scored ? (
                    <p className="mt-1 text-sm text-muted">
                      Score {total} / {ordered.length * 10}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-muted">{ordered.length} questions</p>
                  )}
                  <ol className="mt-4 flex list-decimal flex-col gap-4 pl-5">
                    {ordered.map((entry) => (
                      <li key={entry.id} className="text-sm">
                        <p>{entry.prompt}</p>
                        {entry.options && entry.options.length > 0 ? (
                          <ul className="mt-1 text-muted">
                            {entry.options.map((option) => (
                              <li key={option}>{option === entry.answer ? `Your choice: ${option}` : option}</li>
                            ))}
                          </ul>
                        ) : entry.answer ? (
                          <p className="mt-1 whitespace-pre-wrap text-muted">Your answer: {entry.answer}</p>
                        ) : null}
                        {entry.score !== null ? (
                          <p className="mt-1 text-primary">
                            {entry.score}/10. {entry.note}
                          </p>
                        ) : null}
                        {entry.aiAnswer ? (
                          <p className="mt-2 whitespace-pre-wrap">{entry.aiAnswer}</p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })
          )}
        </div>
      ) : loading ? (
        <p className="mt-6 text-sm text-muted">Writing 9 multiple-choice questions and 1 written question...</p>
      ) : session && topic && session.topicId === topic.id ? (
        <div className="mt-6">
          {session.scored ? (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-background px-5 py-4">
              <p className="text-lg font-semibold">
                Your score is {session.total} / {session.max}
              </p>
              <button
                type="button"
                className={primaryButtonClass}
                disabled={loading}
                onClick={() => void loadQuestions(topic)}
              >
                Next 10 questions
              </button>
            </div>
          ) : null}
          <ol className="flex flex-col gap-6">
            {session.questions.map((question, index) => (
              <li
                key={question.id}
                className="rounded-3xl border border-border bg-background p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-muted">
                  Question {index + 1} · {question.kind === "mcq" ? "Multiple choice" : "Written"}
                </p>
                <h2 className="mt-1 text-base font-semibold">{question.prompt}</h2>
                {question.kind === "mcq" ? (
                  <fieldset className="mt-4 flex flex-col gap-2" disabled={session.scored || scoring}>
                    <legend className="text-sm font-medium">Choose one</legend>
                    {question.options.map((option, optionIndex) => {
                      const selected = question.answer === option;
                      const revealed = question.score !== null;
                      const isCorrect = revealed && option === question.correct;
                      return (
                        <label
                          key={option}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 text-sm ${
                            isCorrect
                              ? "border-primary bg-surface"
                              : selected
                                ? "border-primary"
                                : "border-border"
                          }`}
                        >
                          <input
                            type="radio"
                            name={question.id}
                            className="mt-1"
                            checked={selected}
                            onChange={() => updateAnswer(question.id, option)}
                          />
                          <span>
                            {["A", "B", "C", "D"][optionIndex]}. {option}
                          </span>
                        </label>
                      );
                    })}
                  </fieldset>
                ) : (
                  <>
                    <label className="mt-4 block text-sm font-medium" htmlFor={`answer-${question.id}`}>
                      Write your answer
                    </label>
                    <textarea
                      id={`answer-${question.id}`}
                      value={question.answer}
                      rows={4}
                      disabled={session.scored || scoring}
                      onChange={(event) => updateAnswer(question.id, event.target.value)}
                      className={`${inputClass} mt-1`}
                    />
                  </>
                )}
                {question.score !== null ? (
                  <p className="mt-3 text-sm text-primary">
                    {question.score}/10. {question.note}
                  </p>
                ) : null}
                <button
                  type="button"
                  className={`${secondaryButtonClass} mt-3`}
                  disabled={Boolean(askingId) || Boolean(question.aiAnswer)}
                  onClick={() => void askAi(question)}
                >
                  {question.aiAnswer ? "Asked" : askingId === question.id ? "Answering..." : "Ask AI"}
                </button>
                {question.aiAnswer ? (
                  <div className="mt-3 whitespace-pre-wrap rounded-2xl bg-surface px-4 py-3 text-sm">
                    {question.aiAnswer}
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
          {session.scored ? null : (
            <div className="mt-6">
              <button
                type="button"
                className={primaryButtonClass}
                disabled={scoring}
                onClick={() => void seeScore()}
              >
                {scoring ? "Submitting..." : "Submit"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">
          Choose a concept. Each round has 9 multiple-choice questions and 1 written question from that topic.
        </p>
      )}
    </div>
  );
}
