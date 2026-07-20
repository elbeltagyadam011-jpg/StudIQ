export type AppLanguage = "en" | "ar";

export interface KeyConcept {
  concept: string;
  explanation: string;
}

export interface OcrResult {
  detectedLanguage: "en" | "ar";
  subject?: "Mathematics" | "Chemistry" | "Physics" | "Biology" | "Arabic" | "English";
  title: string;
  extractedText: string;
  summary: string;
  keyConcepts: KeyConcept[];
  lowConfidence?: boolean;
  lowConfidenceReason?: string;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  topic?: string;
  optionsExplanations?: string[];
  textbookParagraph?: string;
  suggestedReview?: string;
}

export interface Quiz {
  quizTitle: string;
  questions: QuizQuestion[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface Definition {
  term: string;
  meaning: string;
}

export interface Law {
  name: string;
  description: string;
  equation?: string;
}

export interface Formula {
  name: string;
  expression: string;
  explanation: string;
}

export interface ExpectedQuestion {
  question: string;
  answer: string;
  rationale: string;
}

export interface RepeatedIdea {
  idea: string;
  importance: string;
}

export interface RevisionPack {
  flashcards: Flashcard[];
  definitions: Definition[];
  laws: Law[];
  formulas: Formula[];
  onePageSummary: string;
  quickReview: string;
  expectedQuestions: ExpectedQuestion[];
  repeatedIdeas: RepeatedIdea[];
}

export interface SavedSession {
  id: string;
  title: string;
  timestamp: string;
  language: AppLanguage;
  ocrResult: OcrResult;
  quiz: Quiz | null;
  quizScore?: number | null;
  quizTotalQuestions?: number | null;
  quizCompleted?: boolean;
  studyTimeSeconds?: number;
  revision?: RevisionPack | null;
  chatHistory: ChatMessage[];
  imageSrc?: string; // Optional saved image thumbnail
}
