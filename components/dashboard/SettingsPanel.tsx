"use client";

import { useEffect, useState } from "react";
import {
  errorClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/classes";
import { onAgentActiveChange, readAgentActive, writeAgentActive } from "@/lib/agentActive";
import {
  readGroqKeys,
  readGroqModels,
  saveGroqKeys,
  saveGroqModels,
  type ChoiceList,
} from "@/lib/groqKey";

function maskKey(value: string) {
  if (value.length <= 8) return "Saved key";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function ChoiceField({
  id,
  label,
  hint,
  list,
  placeholder,
  mask,
  validate,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  list: ChoiceList;
  placeholder: string;
  mask?: (value: string) => string;
  validate: (value: string) => string;
  onChange: (list: ChoiceList) => void;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  function add() {
    const next = draft.trim();
    const problem = validate(next);
    if (problem) {
      setError(problem);
      return;
    }
    const options = list.options.includes(next) ? list.options : [...list.options, next];
    onChange({ options, selected: next });
    setDraft("");
    setError("");
  }

  function remove() {
    const options = list.options.filter((item) => item !== list.selected);
    onChange({ options, selected: options[0] ?? "" });
  }

  return (
    <div className="mt-5">
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={list.selected}
        onChange={(event) => onChange({ ...list, selected: event.target.value })}
        className={inputClass}
      >
        {list.options.length === 0 ? <option value="">No values yet</option> : null}
        {list.options.map((option) => (
          <option key={option} value={option}>
            {mask ? mask(option) : option}
          </option>
        ))}
      </select>
      <p className="mt-2 text-sm text-muted">{hint}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          className={`${inputClass} min-w-0 flex-1`}
          autoComplete="off"
          type={mask ? "password" : "text"}
        />
        <button type="button" className={primaryButtonClass} onClick={add}>
          Add
        </button>
        {list.selected ? (
          <button type="button" className={secondaryButtonClass} onClick={remove}>
            Remove
          </button>
        ) : null}
      </div>
      {error ? (
        <p className={`${errorClass} mt-2`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function SettingsPanel() {
  const [keys, setKeys] = useState<ChoiceList>({ options: [], selected: "" });
  const [models, setModels] = useState<ChoiceList>({ options: [], selected: "" });
  const [serverKey, setServerKey] = useState(false);
  const [agentOn, setAgentOn] = useState(false);

  useEffect(() => {
    setKeys(readGroqKeys());
    setModels(readGroqModels());
    setAgentOn(readAgentActive());
    const stopActive = onAgentActiveChange(() => setAgentOn(readAgentActive()));
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
      stopActive();
    };
  }, []);

  return (
    <div className="w-full">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 text-sm text-muted">
        Add values to each dropdown, then choose the one the study agent should use.
      </p>
      <div className="mt-8 max-w-xl rounded-3xl border border-border bg-background p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Study agent</h2>
        <p className="mt-2 text-sm text-muted">
          Keys stay in this browser. Get a free key from{" "}
          <a
            className="font-medium text-primary hover:underline"
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noreferrer"
          >
            console.groq.com
          </a>
          .
        </p>
        <div className="mt-5">
          <p className={labelClass}>Agent</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={agentOn ? primaryButtonClass : secondaryButtonClass}
              onClick={() => writeAgentActive(true)}
            >
              Active
            </button>
            <button
              type="button"
              className={agentOn ? secondaryButtonClass : primaryButtonClass}
              onClick={() => writeAgentActive(false)}
            >
              Deactive
            </button>
          </div>
          <p className="mt-2 text-sm text-muted">
            {agentOn
              ? "The study agent is open on every page."
              : "The study agent stays hidden until you set it to Active."}
          </p>
        </div>
        {serverKey ? (
          <p className="mt-3 text-sm text-muted">
            A server key exists as a backup. A key selected here is used first.
          </p>
        ) : null}
        <ChoiceField
          id="groq-api-key"
          label="GROQ_API_KEY"
          hint={
            keys.selected
              ? "The selected key is the one the agent uses."
              : "Add a key, then pick it in the dropdown."
          }
          list={keys}
          placeholder="Paste a new Groq API key"
          mask={maskKey}
          validate={(value) =>
            value.length < 20 || value.length > 200 ? "Paste the full Groq API key." : ""
          }
          onChange={(next) => {
            setKeys(next);
            saveGroqKeys(next);
          }}
        />
        <ChoiceField
          id="groq-model"
          label="GROQ_MODEL"
          hint={
            models.selected
              ? `The agent uses ${models.selected}.`
              : "Add a model id, then pick it in the dropdown."
          }
          list={models}
          placeholder="Add a model id"
          validate={(value) =>
            /^[A-Za-z0-9_.:/-]{3,80}$/.test(value)
              ? ""
              : "Use a model id such as openai/gpt-oss-20b."
          }
          onChange={(next) => {
            setModels(next);
            saveGroqModels(next);
          }}
        />
      </div>
    </div>
  );
}
