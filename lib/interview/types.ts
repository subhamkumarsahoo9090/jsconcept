export type InterviewTopic = {
  id: string;
  librarySlug: string;
  libraryTitle: string;
  tabId: string;
  tabTitle: string;
  label: string;
};

export type QuestionKind = "mcq" | "written";

export type QuizQuestion = {
  id: string;
  kind: QuestionKind;
  prompt: string;
  options: string[];
  correct: string;
  answer: string;
  aiAnswer: string;
  score: number | null;
  note: string;
};

export type QuizSession = {
  topicId: string;
  roundId: string;
  startedAt: number;
  questions: QuizQuestion[];
  scored: boolean;
  total: number;
  max: number;
};

export type HistoryEntry = {
  id: string;
  roundId: string;
  topicId: string;
  topicLabel: string;
  prompt: string;
  kind?: QuestionKind;
  options?: string[];
  correct?: string;
  answer: string;
  aiAnswer: string;
  score: number | null;
  note: string;
  askedAt: number;
};
