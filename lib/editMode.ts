"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "jsexport.editMode";
const CHANGE_EVENT = "jsexport-edit-mode";

export function readEditMode() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "on";
}

export function writeEditMode(on: boolean) {
  localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function onEditModeChange(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}

export function useEditMode() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(readEditMode());
    return onEditModeChange(() => setOn(readEditMode()));
  }, []);

  return on;
}
