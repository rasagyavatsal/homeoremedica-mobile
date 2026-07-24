import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    BookType,
    findRemedies as dbFindRemedies,
    initDatabase,
    searchSymptoms,
    searchSymptomsCount,
} from '../lib/database';

export type { BookType };

interface AppContextType {
  selectedBook: BookType;
  setSelectedBook: (book: BookType) => void;
  selectedSymptoms: string[];
  setSelectedSymptoms: (symptoms: string[]) => void;
  toggleSymptom: (symptom: string) => void;
  clearSymptoms: () => void;
  isDbReady: boolean;
  dbError: string | null;
  // Async methods for database queries
  searchSymptomsAsync: (query: string, limit?: number, offset?: number) => Promise<string[]>;
  getSymptomsCountAsync: (query: string) => Promise<number>;
  findRemediesAsync: () => Promise<{ remedy: string; slug: string; matchedSymptoms: string[] }[]>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [selectedBook, setSelectedBook] = useState<BookType>('boericke-MM');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Initialize database on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        setIsDbReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setDbError(error instanceof Error ? error.message : 'Database initialization failed');
      }
    };
    init();
  }, []);

  const toggleSymptom = useCallback((symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  }, []);

  const clearSymptoms = useCallback(() => {
    setSelectedSymptoms([]);
  }, []);

  const searchSymptomsAsync = useCallback(
    async (query: string, limit: number = 100, offset: number = 0): Promise<string[]> => {
      if (!isDbReady) return [];
      return searchSymptoms(selectedBook, query, limit, offset);
    },
    [selectedBook, isDbReady]
  );

  const getSymptomsCountAsync = useCallback(
    async (query: string): Promise<number> => {
      if (!isDbReady) return 0;
      return searchSymptomsCount(selectedBook, query);
    },
    [selectedBook, isDbReady]
  );

  const findRemediesAsync = useCallback(async (): Promise<
    { remedy: string; slug: string; matchedSymptoms: string[] }[]
  > => {
    if (selectedSymptoms.length === 0) return [];
    
    if (!isDbReady) {
      console.warn('Database not ready for remedy matching');
      return [];
    }

    return dbFindRemedies(selectedBook, selectedSymptoms);
  }, [selectedBook, selectedSymptoms, isDbReady]);

  const value = useMemo(
    () => ({
      selectedBook,
      setSelectedBook,
      selectedSymptoms,
      setSelectedSymptoms,
      toggleSymptom,
      clearSymptoms,
      isDbReady,
      dbError,
      searchSymptomsAsync,
      getSymptomsCountAsync,
      findRemediesAsync,
    }),
    [
      selectedBook,
      selectedSymptoms,
      toggleSymptom,
      clearSymptoms,
      isDbReady,
      dbError,
      searchSymptomsAsync,
      getSymptomsCountAsync,
      findRemediesAsync,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
