export type OpenScreen = {
  pathname: string;
  libraryTitle: string;
  tabId: string;
  tabTitle: string;
};

const EMPTY: OpenScreen = { pathname: "", libraryTitle: "", tabId: "", tabTitle: "" };
const CHANGE_EVENT = "jsexport-open-screen";
let current: OpenScreen = EMPTY;

export function writeOpenScreen(next: OpenScreen) {
  current = next;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function readOpenScreen() {
  return current;
}

export function onOpenScreenChange(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}
