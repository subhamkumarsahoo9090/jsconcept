"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { demoAccount } from "@/lib/demoAccount";

const USERS_KEY = "masterweb.users";
const SESSION_KEY = "masterweb.session";

export type SessionUser = {
  name: string;
  email: string;
};

type StoredUser = SessionUser & {
  password: string;
};

type AppContextValue = {
  user: SessionUser | null;
  ready: boolean;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  login: (email: string, password: string) => string | null;
  logout: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function isStoredUser(item: unknown): item is StoredUser {
  if (typeof item !== "object" || item === null) return false;
  const record = item as Record<string, unknown>;
  return (
    typeof record.name === "string" &&
    typeof record.email === "string" &&
    typeof record.password === "string"
  );
}

function readUsers(): StoredUser[] {
  let stored: StoredUser[] = [];
  let raw: string | null = null;

  try {
    raw = localStorage.getItem(USERS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) stored = parsed.filter(isStoredUser);
    }
  } catch {
    stored = [];
  }

  const users = [
    { ...demoAccount },
    ...stored.filter(
      (account) =>
        account.email !== demoAccount.email &&
        account.email !== "subham@gmial.com",
    ),
  ];
  const serialized = JSON.stringify(users);
  if (serialized !== raw) {
    localStorage.setItem(USERS_KEY, serialized);
  }
  return users;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseSession(raw: string): SessionUser | null {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) return null;
  const record = parsed as Record<string, unknown>;
  if (typeof record.name !== "string" || typeof record.email !== "string") {
    return null;
  }
  return { name: record.name, email: record.email };
}

const sessionListeners = new Set<() => void>();
let cachedSessionRaw: string | null | undefined;
let cachedSession: SessionUser | null = null;

function subscribeSession(listener: () => void) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

function emitSession() {
  sessionListeners.forEach((listener) => listener());
}

function getSessionSnapshot(): SessionUser | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw === cachedSessionRaw) return cachedSession;

  cachedSessionRaw = raw;
  if (!raw) {
    cachedSession = null;
    return cachedSession;
  }

  try {
    cachedSession = parseSession(raw);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    cachedSessionRaw = null;
    cachedSession = null;
  }

  return cachedSession;
}

function getServerSession(): SessionUser | null {
  return null;
}

function subscribeClient() {
  return () => {};
}

function getClientReady() {
  return true;
}

function getServerReady() {
  return false;
}

function writeSession(session: SessionUser | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    cachedSessionRaw = null;
    cachedSession = null;
  } else {
    const raw = JSON.stringify(session);
    localStorage.setItem(SESSION_KEY, raw);
    cachedSessionRaw = raw;
    cachedSession = session;
  }
  emitSession();
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const user = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    getServerSession,
  );
  const ready = useSyncExternalStore(
    subscribeClient,
    getClientReady,
    getServerReady,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => !open);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!isEmail(trimmedEmail)) return "Enter a valid email.";
    if (password.length < 6) return "Password must be at least 6 characters.";

    const match = readUsers().find(
      (account) =>
        account.email === trimmedEmail && account.password === password,
    );
    if (!match) return "Email or password is incorrect.";

    writeSession({ name: match.name, email: match.email });
    return null;
  }, []);

  const logout = useCallback(() => {
    writeSession(null);
    setSidebarOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      sidebarOpen,
      toggleSidebar,
      setSidebarOpen,
      login,
      logout,
    }),
    [user, ready, sidebarOpen, toggleSidebar, login, logout],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider.");
  }
  return context;
}
