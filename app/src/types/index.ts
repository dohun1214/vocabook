export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Wordbook {
  id: number;
  userId: number;
  name: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Word {
  id: number;
  wordbookId: number;
  userId: number;
  word: string;
  meaning: string;
  example?: string;
  isFavorite: boolean;
  nextReviewAt: string;
  interval: number;
  easeFactor: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudyLog {
  id: number;
  userId: number;
  wordId: number;
  mode: 'FLASHCARD' | 'QUIZ_MULTIPLE' | 'QUIZ_SHORT';
  result: 'CORRECT' | 'INCORRECT';
  studiedAt: string;
}

export interface Stats {
  words: {
    total: number;
    favorite: number;
  };
  study: {
    total: number;
    todayCount: number;
    accuracy: number;
    streak: number;
  };
  wordbooks: Array<{
    id: number;
    name: string;
    wordCount: number;
  }>;
}

export type StudyMode = 'FLASHCARD' | 'QUIZ_MULTIPLE' | 'QUIZ_SHORT';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  WordbookList: undefined;
  WordList: { wordbookId: number; wordbookName: string };
  StudyModeSelect: { wordbookId: number; wordbookName: string };
  Flashcard: { words: Word[]; mode: 'study' | 'review' };
  QuizMultiple: { words: Word[] };
  QuizShort: { words: Word[] };
  StudyResult: { correct: number; incorrect: number; incorrectWords: Word[]; mode: StudyMode };
  OcrResult: { wordbookId: number; parsedWords: Array<{ word: string; meaning: string; example: string }> };
  TodayReview: undefined;
  Stats: undefined;
  Settings: undefined;
};
