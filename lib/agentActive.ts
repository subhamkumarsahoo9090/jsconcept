const SESSION_KEY = "jsexport.agent";
const CHANGE_EVENT = "jsexport-agent-active";

export function readAgentActive() {
  if (typeof window === "undefined") return false;
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "{}") as { active?: unknown };
    return parsed.active === true;
  } catch {
    return false;
  }
}

export function writeAgentActive(active: boolean) {
  let messages: unknown[] = [];
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "{}") as { messages?: unknown };
    if (Array.isArray(parsed.messages)) messages = parsed.messages;
  } catch {
    messages = [];
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ active, messages }));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function notifyAgentActive() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function onAgentActiveChange(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}
