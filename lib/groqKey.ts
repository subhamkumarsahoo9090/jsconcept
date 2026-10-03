export const GROQ_KEY_STORAGE = "jsexport.groqKey";

const KEYS_STORAGE = "jsexport.groqKeys";
const MODELS_STORAGE = "jsexport.groqModels";
const CHANGE_EVENT = "jsexport-groq-key";

export const DEFAULT_GROQ_MODELS = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
  "qwen/qwen3.8-27b",
];

export type ChoiceList = {
  options: string[];
  selected: string;
};

function notify() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function parseList(raw: string | null): ChoiceList | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { options?: unknown; selected?: unknown };
    const options = Array.isArray(parsed.options)
      ? [
          ...new Set(
            parsed.options
              .filter((item): item is string => typeof item === "string")
              .map((item) => item.trim())
              .filter(Boolean),
          ),
        ]
      : [];
    const selected =
      typeof parsed.selected === "string" && options.includes(parsed.selected.trim())
        ? parsed.selected.trim()
        : (options[0] ?? "");
    return { options, selected };
  } catch {
    return null;
  }
}

export function readGroqKeys(): ChoiceList {
  if (typeof window === "undefined") return { options: [], selected: "" };
  const stored = parseList(localStorage.getItem(KEYS_STORAGE));
  if (stored) return stored;
  const legacy = localStorage.getItem(GROQ_KEY_STORAGE)?.trim() ?? "";
  if (!legacy) return { options: [], selected: "" };
  return { options: [legacy], selected: legacy };
}

export function readGroqModels(): ChoiceList {
  if (typeof window === "undefined") {
    return { options: [...DEFAULT_GROQ_MODELS], selected: DEFAULT_GROQ_MODELS[0] };
  }
  return (
    parseList(localStorage.getItem(MODELS_STORAGE)) ?? {
      options: [...DEFAULT_GROQ_MODELS],
      selected: DEFAULT_GROQ_MODELS[0],
    }
  );
}

export function readGroqKey() {
  return readGroqKeys().selected;
}

export function readGroqModel() {
  return readGroqModels().selected || DEFAULT_GROQ_MODELS[0];
}

function writeList(storageKey: string, list: ChoiceList) {
  const options = [...new Set(list.options.map((item) => item.trim()).filter(Boolean))];
  const selected = options.includes(list.selected) ? list.selected : (options[0] ?? "");
  localStorage.setItem(storageKey, JSON.stringify({ options, selected }));
  notify();
}

export function saveGroqKeys(list: ChoiceList) {
  writeList(KEYS_STORAGE, list);
}

export function saveGroqModels(list: ChoiceList) {
  writeList(MODELS_STORAGE, list);
}

export function onGroqKeyChange(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}
