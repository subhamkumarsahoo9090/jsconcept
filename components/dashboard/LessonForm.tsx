"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  createLesson,
  deleteLesson,
  updateLesson,
} from "@/lib/libraryActions";
import {
  emptyActionState,
  paragraphsToText,
  type ConceptTab,
  type Lesson,
} from "@/lib/libraryTypes";
import {
  errorClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/classes";
import { useEditMode } from "@/lib/editMode";

function LessonFields({
  lesson,
  tabs,
  defaultTabId,
  idPrefix,
  compact = false,
}: {
  lesson?: Lesson;
  tabs: ConceptTab[];
  defaultTabId?: string;
  idPrefix: string;
  compact?: boolean;
}) {
  const textRows = compact ? 3 : 6;
  const codeRows = compact ? 2 : 5;
  const areaClass = compact
    ? `${inputClass} resize-none overflow-hidden`
    : inputClass;
  return (
    <>
      <div>
        <label className={labelClass} htmlFor={`${idPrefix}-tab`}>
          Concept tab
        </label>
        <select
          id={`${idPrefix}-tab`}
          name="tabId"
          defaultValue={lesson?.tabId ?? defaultTabId ?? tabs[0]?.id}
          className={inputClass}
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass} htmlFor={`${idPrefix}-title`}>
          Lesson title
        </label>
        <input
          id={`${idPrefix}-title`}
          name="title"
          required
          defaultValue={lesson?.title ?? ""}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor={`${idPrefix}-english`}>
          English
        </label>
        <textarea
          id={`${idPrefix}-english`}
          name="english"
          required
          rows={textRows}
          defaultValue={lesson ? paragraphsToText(lesson.english) : ""}
          placeholder="Separate paragraphs with a blank line."
          className={areaClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor={`${idPrefix}-hindi`}>
          Hindi in English letters
        </label>
        <textarea
          id={`${idPrefix}-hindi`}
          name="hindi"
          required
          rows={textRows}
          defaultValue={lesson ? paragraphsToText(lesson.hindi) : ""}
          placeholder="Separate paragraphs with a blank line."
          className={areaClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor={`${idPrefix}-code`}>
          Code sample
        </label>
        <textarea
          id={`${idPrefix}-code`}
          name="code"
          rows={codeRows}
          defaultValue={lesson?.code ?? ""}
          className={`${areaClass} font-mono`}
        />
      </div>
    </>
  );
}

export function AddLessonForm({
  libraryId,
  tabs,
  activeTabId,
  inline = false,
}: {
  libraryId: string;
  tabs: ConceptTab[];
  activeTabId: string;
  inline?: boolean;
}) {
  const action = createLesson.bind(null, libraryId);
  const [state, formAction, pending] = useActionState(action, emptyActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function closeDialog() {
    dialogRef.current?.close();
  }

  useEffect(() => {
    if (!state.savedAt) return;
    formRef.current?.reset();
    closeDialog();
  }, [state.savedAt]);

  return (
    <div className={inline ? "shrink-0" : "mt-6"}>
      <button
        type="button"
        className={
          inline
            ? "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:bg-surface"
            : primaryButtonClass
        }
        onClick={() => dialogRef.current?.showModal()}
      >
        Add lesson
      </button>
      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 z-50 m-0 w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/40"
        onClick={(event) => {
          if (event.target === dialogRef.current) closeDialog();
        }}
      >
        <form
          ref={formRef}
          action={formAction}
          className="grid gap-3 p-5 sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Add lesson</h2>
            <button
              type="button"
              className="rounded-full px-3 py-1.5 text-sm text-muted hover:bg-surface"
              onClick={closeDialog}
            >
              Close
            </button>
          </div>
          <LessonFields
            tabs={tabs}
            defaultTabId={activeTabId}
            idPrefix={`new-${libraryId}`}
            compact
          />
          {state.error ? (
            <p className={errorClass} role="alert">
              {state.error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending} className={primaryButtonClass}>
              {pending ? "Saving..." : "Save lesson"}
            </button>
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={closeDialog}
            >
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

export function LessonEditor({
  libraryId,
  lesson,
  tabs,
  onDone,
}: {
  libraryId: string;
  lesson: Lesson;
  tabs: ConceptTab[];
  onDone: () => void;
}) {
  const action = updateLesson.bind(null, libraryId, lesson.id);
  const [state, formAction, pending] = useActionState(action, emptyActionState);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (state.savedAt) onDoneRef.current();
  }, [state.savedAt]);

  return (
    <form action={formAction} className="grid gap-3 px-5 py-5 sm:px-6">
      <LessonFields lesson={lesson} tabs={tabs} idPrefix={lesson.id} />
      {state.error ? (
        <p className={errorClass} role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Saving..." : "Save lesson"}
        </button>
        <button type="button" onClick={onDone} className={secondaryButtonClass}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function LessonCard({
  libraryId,
  lesson,
  tabs,
  index,
}: {
  libraryId: string;
  lesson: Lesson;
  tabs: ConceptTab[];
  index: number;
}) {
  const [editing, setEditing] = useState(false);
  const canEdit = useEditMode();

  return (
    <li className="overflow-hidden rounded-3xl border border-border bg-background shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Lesson {index + 1}
          </p>
          <h2 className="mt-1 text-xl font-semibold">{lesson.title}</h2>
        </div>
        {canEdit ? (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:bg-surface"
              onClick={() => setEditing((open) => !open)}
            >
              {editing ? "Close" : "Edit"}
            </button>
            <DeleteLessonButton libraryId={libraryId} lessonId={lesson.id} />
          </div>
        ) : null}
      </div>
      {canEdit && editing ? (
        <LessonEditor
          libraryId={libraryId}
          lesson={lesson}
          tabs={tabs}
          onDone={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="grid md:grid-cols-2">
            <section className="px-5 py-5 sm:px-6">
              <h3 className="text-sm font-semibold text-primary">English</h3>
              <div className="mt-3 space-y-3 text-sm leading-6">
                {lesson.english.map((paragraph, paragraphIndex) => (
                  <p key={`${lesson.id}-en-${paragraphIndex}`}>{paragraph}</p>
                ))}
              </div>
            </section>
            <section className="border-t border-border bg-surface px-5 py-5 sm:px-6 md:border-t-0 md:border-l">
              <h3 className="text-sm font-semibold">Hindi</h3>
              <p className="mt-1 text-xs text-muted">
                Hindi written in English letters
              </p>
              <div className="mt-3 space-y-3 text-sm leading-6">
                {lesson.hindi.map((paragraph, paragraphIndex) => (
                  <p key={`${lesson.id}-hi-${paragraphIndex}`}>{paragraph}</p>
                ))}
              </div>
            </section>
          </div>
          {lesson.code ? (
            <pre className="overflow-x-auto bg-[#1c1917] px-5 py-4 text-sm leading-6 text-[#f6f1e7] sm:px-6">
              <code>{lesson.code}</code>
            </pre>
          ) : null}
        </>
      )}
    </li>
  );
}

export function DeleteLessonButton({
  libraryId,
  lessonId,
}: {
  libraryId: string;
  lessonId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-full px-3 py-1.5 text-sm text-danger hover:bg-surface"
      onClick={() => {
        if (!window.confirm("Delete this lesson?")) return;
        startTransition(() => {
          void deleteLesson(libraryId, lessonId);
        });
      }}
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}
