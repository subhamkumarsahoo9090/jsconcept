import "server-only";

import { readLibraries } from "@/lib/libraryStore";
import type { Library } from "@/lib/libraryTypes";

const STATIC_PATHS = new Set(["/", "/login", "/dashboard"]);

export async function loadLibraries() {
  return readLibraries();
}

export function navigationCatalog(libraries: Library[]) {
  const lines = [
    "/ | Home",
    "/login | Log in",
    "/dashboard | All libraries",
  ];
  for (const library of libraries) {
    const tabs = library.tabs.map((tab) => `${tab.title}=${tab.id}`).join("; ");
    lines.push(`/dashboard/${library.slug} | ${library.title} | ${tabs}`);
  }
  return lines.join("\n");
}

export function cleanPath(input: string) {
  const value = input.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(value, "http://local");
  } catch {
    return null;
  }
  const pathname = url.pathname.replace(/\/$/, "") || "/";
  if (pathname.includes("..")) return null;
  return { pathname, tab: url.searchParams.get("tab")?.trim() ?? "" };
}

export function resolveAppPath(libraries: Library[], input: string) {
  const parsed = cleanPath(input);
  if (!parsed) return null;
  if (STATIC_PATHS.has(parsed.pathname)) return parsed.pathname;

  const slug = parsed.pathname.startsWith("/dashboard/")
    ? decodeURIComponent(parsed.pathname.slice("/dashboard/".length))
    : "";
  if (!slug || slug.includes("/")) return null;
  const library = libraries.find((item) => item.slug === slug);
  if (!library) return null;
  if (!parsed.tab) return parsed.pathname;
  const tab = library.tabs.find(
    (item) =>
      item.id === parsed.tab || item.title.toLowerCase() === parsed.tab.toLowerCase(),
  );
  if (!tab) return parsed.pathname;
  return `${parsed.pathname}?tab=${encodeURIComponent(tab.id)}`;
}

export function describePage(libraries: Library[], pathname: string, tab = "") {
  const parsed = cleanPath(pathname) ?? { pathname: "/", tab: "" };
  const requestedTab = tab || parsed.tab;

  if (parsed.pathname === "/") {
    const names = libraries.map((library) => library.title).join(", ");
    return `Home page. Coding lessons in English and Hindi. Libraries: ${names}.`;
  }
  if (parsed.pathname === "/login") {
    return "Log in page. The student signs in with an email and password.";
  }
  if (parsed.pathname === "/dashboard") {
    return libraries
      .map((library) => `${library.title}: ${library.summary}`)
      .join("\n");
  }

  const slug = parsed.pathname.startsWith("/dashboard/")
    ? decodeURIComponent(parsed.pathname.slice("/dashboard/".length))
    : "";
  const library = libraries.find((item) => item.slug === slug);
  if (!library) return "This path is not one of the lesson pages.";

  const active =
    library.tabs.find(
      (item) =>
        item.id === requestedTab ||
        item.title.toLowerCase() === requestedTab.toLowerCase(),
    ) ?? library.tabs[0];
  const lessons = active
    ? library.lessons.filter((lesson) => lesson.tabId === active.id)
    : [];
  const body = lessons
    .map((lesson) =>
      [
        `Lesson: ${lesson.title}`,
        lesson.english.join("\n\n"),
        `Hindi: ${lesson.hindi.join("\n\n")}`,
        lesson.code ? `Code:\n${lesson.code}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n")
    .slice(0, 3500);

  return [
    `Library: ${library.title}`,
    `Summary: ${library.summary}`,
    `Open concept: ${active?.title ?? "none"}`,
    `Other concepts: ${library.tabs.map((item) => item.title).join(", ")}`,
    body || "This concept has no lesson text yet.",
  ].join("\n");
}
