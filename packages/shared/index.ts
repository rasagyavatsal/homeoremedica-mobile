// Types
export type {
  Remedy,
  Symptom,
  Book,
  Case,
  User,
  SearchResult,
  BookId,
  FindRemedyRequest,
  FindRemedyResponse,
} from './types';

// Validation schemas
export {
  BOOK_IDS,
  bookIdSchema,
  findRemedySchema,
  selectedSymptomSchema,
  caseResultSchema,
  baseCaseSchema,
  createCaseSchema,
  updateCaseSchema,
  aiMatchSymptomsSchema,
  apiErrorSchema,
} from './lib/validation/schemas';

export type {
  SelectedSymptom,
  CaseResult,
  CreateCaseRequest,
  UpdateCaseRequest,
  AiMatchSymptomsRequest,
} from './lib/validation/schemas';

// API Client
export { ApiClient } from './lib/api/client';

// Synonyms
export { symptomSynonyms, expandSingleWord, expandSearchTerms, getExpandedSearchWords } from './lib/synonyms';

// Utils
export { slugify } from './lib/utils';

// Stores
export { createAuthStore } from './lib/stores/auth-store';
export type { AuthAdapter, AuthStoreConfig, AuthState, FirebaseUser } from './lib/stores/auth-store';

export { createCasesStore, normalizeCaseFromApi, isValidCase, isNonEmptyString } from './lib/stores/cases-store';
export type { CasesStoreConfig, CasesState } from './lib/stores/cases-store';

// Password Validation
export { validatePassword, PASSWORD_RULES, PASSWORD_MIN_LENGTH } from './lib/validation/password';
export type { PasswordRule, ValidationResult } from './lib/validation/password';

// Auth Core
export { createFirebaseAuthCore, mapFirebaseUser } from './lib/auth/core';
export type { FirebaseAuthCoreConfig } from './lib/auth/core';

// Repertory Search Service
export { createRepertorySearchService } from './lib/repertory/search-service';
export type { RepertorySearchService, RepertoryQueryExecutor, RemedyMatch, RemedyDetails } from './lib/repertory/search-service';
