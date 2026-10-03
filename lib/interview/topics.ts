import type { Library } from "@/lib/libraryTypes";
import type { InterviewTopic } from "@/lib/interview/types";

export function interviewTopics(libraries: Library[]): InterviewTopic[] {
  return libraries
    .filter((library) => library.slug !== "interview")
    .flatMap((library) =>
      library.tabs.map((tab) => ({
        id: `${library.slug}:${tab.id}`,
        librarySlug: library.slug,
        libraryTitle: library.title,
        tabId: tab.id,
        tabTitle: tab.title,
        label: `${library.title} · ${tab.title}`,
      })),
    );
}
