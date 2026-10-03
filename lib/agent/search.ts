import "server-only";

type Topic = { Text?: string; FirstURL?: string; Topics?: Topic[] };

function clip(value: string, max: number) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

async function readJson(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: {
      Accept: "application/json",
      "User-Agent": "JsExportStudyAgent/1.0 (educational study notes)",
    },
  });
  if (!response.ok) return null;
  return response.json() as Promise<unknown>;
}

function topicLines(topics: Topic[] | undefined, lines: string[]) {
  for (const topic of topics ?? []) {
    if (lines.length >= 3) return;
    if (topic.Topics) {
      topicLines(topic.Topics, lines);
      continue;
    }
    if (!topic.Text || !topic.FirstURL) continue;
    lines.push(`- ${clip(topic.Text, 280)}\n  ${topic.FirstURL}`);
  }
}

async function wikipediaNotes(query: string) {
  const listed = await readJson(
    `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=2&namespace=0&format=json`,
  );
  if (!Array.isArray(listed) || !Array.isArray(listed[1])) return [];
  const titles = listed[1].filter((item): item is string => typeof item === "string");
  const notes: string[] = [];
  for (const title of titles) {
    const summary = await readJson(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    );
    if (!summary || typeof summary !== "object") continue;
    const record = summary as { extract?: unknown; content_urls?: { desktop?: { page?: unknown } } };
    const extract = typeof record.extract === "string" ? record.extract : "";
    const page = record.content_urls?.desktop?.page;
    if (!extract || typeof page !== "string") continue;
    notes.push(`- ${title}: ${clip(extract, 420)}\n  ${page}`);
  }
  return notes;
}

async function duckDuckGoNotes(query: string) {
  const data = await readJson(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
  );
  if (!data || typeof data !== "object") return [];
  const record = data as {
    Heading?: unknown;
    AbstractText?: unknown;
    AbstractURL?: unknown;
    RelatedTopics?: Topic[];
  };
  const lines: string[] = [];
  if (typeof record.AbstractText === "string" && record.AbstractText && typeof record.AbstractURL === "string") {
    const heading = typeof record.Heading === "string" ? record.Heading : "Summary";
    lines.push(`- ${heading}: ${clip(record.AbstractText, 420)}\n  ${record.AbstractURL}`);
  }
  topicLines(record.RelatedTopics, lines);
  return lines;
}

export async function searchOpenSources(query: string) {
  const safe = query.replace(/\s+/g, " ").trim().slice(0, 120);
  if (!safe) return "No open reference was found.";
  const [wiki, web] = await Promise.all([
    wikipediaNotes(safe).catch(() => [] as string[]),
    duckDuckGoNotes(safe).catch(() => [] as string[]),
  ]);
  const notes = [...wiki, ...web].slice(0, 4);
  if (notes.length === 0) {
    return "No open reference was found. Explain with your own simple examples and say that an outside source did not load.";
  }
  return notes.join("\n");
}
