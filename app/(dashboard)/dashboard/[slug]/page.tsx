import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InterviewView from "@/components/dashboard/InterviewView";
import TutorialView from "@/components/dashboard/TutorialView";
import { interviewTopics } from "@/lib/interview/topics";
import { readLibraries } from "@/lib/libraryStore";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = (await readLibraries()).find((library) => library.slug === slug);
  if (!category) return { title: "Library" };

  return {
    title: category.title,
    description: category.summary,
    robots: { index: false, follow: false },
  };
}

export default async function TutorialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const libraries = await readLibraries();
  const category = libraries.find((library) => library.slug === slug);
  if (!category) notFound();

  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading lessons...</p>}>
      {category.slug === "interview" ? (
        <InterviewView category={category} topics={interviewTopics(libraries)} />
      ) : (
        <TutorialView category={category} />
      )}
    </Suspense>
  );
}
