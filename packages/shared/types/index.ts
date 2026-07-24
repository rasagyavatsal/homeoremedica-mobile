import { FindRemedyRequest as ZodFindRemedyRequest, SelectedSymptom } from '../lib/validation/schemas';

export type BookId = ZodFindRemedyRequest['bookId'];

export interface Remedy {
  id: string;
  name: string;
  description?: string;
  symptoms?: string[];
  source?: string;
  book?: BookId;
}

export type Symptom = SelectedSymptom;

export interface Book {
  id: BookId;
  name: string;
  fullName: string;
  remedies: Remedy[];
  symptoms: Symptom[];
}

export interface Case {
  id: string;
  name: string;
  bookId?: BookId;
  selectedSymptoms: Symptom[];
  userId: string;
  timestamp: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface SearchResult {
  remedy: Remedy;
  score: number;
  matchedSymptoms: string[];
}

export type FindRemedyRequest = ZodFindRemedyRequest;

export interface FindRemedyResponse {
  remedies: {
    id: string;
    name: string;
    description?: string;
    score: number;
    matchedSymptoms: string[];
    sourceBooks: string[];
  }[];
  totalMatches: number;
}
