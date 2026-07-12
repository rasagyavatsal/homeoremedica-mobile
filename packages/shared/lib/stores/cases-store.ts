import { create } from 'zustand';
import { BookId, Case, Symptom } from '../../types';
import { ApiClient } from '../api/client';

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function normalizeCaseFromApi(caseData: any): Case | null {
  if (!isNonEmptyString(caseData?.id)) {
    return null;
  }

  return {
    id: caseData.id,
    name: caseData.name || caseData.title,
    bookId: caseData.bookId || undefined,
    selectedSymptoms: caseData.selectedSymptoms || [],
    userId: caseData.userId,
    timestamp: new Date(caseData.timestamp || caseData.createdAt)
  };
}

export function isValidCase(value: unknown): value is Case {
  return Boolean(value) && isNonEmptyString((value as any).id);
}

export interface CasesStoreConfig {
  apiClient: ApiClient;
  getToken: () => Promise<string | null>;
}

type CaseUpdates = {
  name?: string;
  selectedSymptoms?: Symptom[];
  bookId?: BookId;
};

export interface CasesState {
  cases: Case[];
  selectedCase: Case | null;
  loading: boolean;
  error: string | null;
  
  loadUserCases: (userId?: string) => Promise<void>;
  addCase: (name: string, selectedSymptoms: Symptom[], bookId?: BookId, userId?: string) => Promise<void>;
  updateCase: (id: string, updates: CaseUpdates) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  selectCase: (id: string | null) => void;
  clearCases: () => void;
}

function replaceCase(cases: Case[], id: string, updatedCase: Case) {
  return cases
    .map((caseItem) => (caseItem.id === id ? updatedCase : caseItem))
    .filter(isValidCase);
}

function removeCaseById(cases: Case[], id: string) {
  return cases.filter((caseItem) => caseItem.id !== id);
}

function getSanitizedSelectedCase(selectedCase: Case | null) {
  return selectedCase && isValidCase(selectedCase) ? selectedCase : null;
}

export function createCasesStore(config: CasesStoreConfig) {
  const { apiClient, getToken } = config;

  return create<CasesState>((set, get) => ({
    cases: [],
    selectedCase: null,
    loading: false,
    error: null,
    
    clearCases: () => set({
      cases: [],
      selectedCase: null,
      loading: false,
      error: null,
    }),
    
    loadUserCases: async (userId?: string) => {
      set({ loading: true, error: null });
      try {
        const token = await getToken();
        if (!token) {
          set({ loading: false, error: 'User not authenticated' });
          return;
        }
        apiClient.setAuthToken(token);

        const data = await apiClient.getCases();
        const cases: Case[] = Array.isArray(data?.cases)
          ? data.cases
              .map((caseData: any) => normalizeCaseFromApi(caseData))
              .filter((item: Case | null): item is Case => Boolean(item))
          : [];
        
        set({ cases, loading: false });
      } catch (error: any) {
        console.error('Error loading cases:', error);
        set({ loading: false, error: error.message || 'Failed to load cases' });
      }
    },
    
    addCase: async (name: string, selectedSymptoms: Symptom[], bookId?: BookId, userId?: string) => {
      try {
        const token = await getToken();
        if (!token) throw new Error('No authentication token');
        apiClient.setAuthToken(token);

        const caseData = await apiClient.createCase({
          name,
          selectedSymptoms,
          ...(bookId && { bookId })
        });

        const newCase = normalizeCaseFromApi(caseData);
        if (!newCase) throw new Error('Invalid response from server: missing case id');
        
        set((state) => ({
          cases: [newCase, ...state.cases].filter(isValidCase),
          selectedCase: newCase
        }));
      } catch (error) {
        console.error('Error adding case:', error);
        throw error;
      }
    },
    
    updateCase: async (id: string, updates: CaseUpdates) => {
      try {
        const token = await getToken();
        if (!token) throw new Error('No authentication token');
        apiClient.setAuthToken(token);

        const caseData = await apiClient.updateCase(id, updates);
        const updatedCase = normalizeCaseFromApi({ ...caseData, id: caseData?.id || id });
        if (!updatedCase) throw new Error('Invalid response from server: missing case id');
        
        set((state) => ({
          cases: replaceCase(state.cases, id, updatedCase),
          selectedCase: state.selectedCase?.id === id ? updatedCase : state.selectedCase
        }));
      } catch (error) {
        console.error('Error updating case:', error);
        throw error;
      }
    },
    
    deleteCase: async (id: string) => {
      try {
        if (!id || typeof id !== 'string' || id.trim() === '') {
          set((state) => ({
            cases: state.cases.filter(isValidCase),
            selectedCase: getSanitizedSelectedCase(state.selectedCase),
          }));
          throw new Error('Invalid case ID');
        }

        const token = await getToken();
        if (!token) throw new Error('No authentication token');
        apiClient.setAuthToken(token);

        await apiClient.deleteCase(id);
        
        set((state) => ({
          cases: removeCaseById(state.cases, id),
          selectedCase: state.selectedCase?.id === id ? null : state.selectedCase
        }));
      } catch (error) {
        console.error('Error deleting case:', error);
        throw error;
      }
    },
    
    selectCase: (id: string | null) => {
      const { cases } = get();
      const selectedCase = id ? cases.find(c => c.id === id) || null : null;
      set({ selectedCase });
    }
  }));
}
