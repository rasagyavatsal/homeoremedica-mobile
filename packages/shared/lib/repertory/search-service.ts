import { expandSearchTerms } from '../synonyms';

export interface RepertoryQueryExecutor {
  all<T>(sql: string, params?: (string | number)[]): Promise<T[]>;
  get<T>(sql: string, params?: (string | number)[]): Promise<T | null>;
}

export interface RemedyMatch {
  remedy: string;
  slug: string;
  matchedSymptoms: string[];
}

export interface RemedyDetails {
  name: string;
  description: string;
  symptoms: string[];
  book: string;
}

export interface RepertorySearchService {
  listSymptoms(book: string, search?: string, limit?: number, offset?: number): Promise<string[]>;
  countSymptoms(book: string, search?: string): Promise<number>;
  suggestSymptoms(book: string, search: string, limit?: number, offset?: number): Promise<string[]>;
  countSymptomSuggestions(book: string, search: string): Promise<number>;
  findRemedies(book: string, symptoms: string[]): Promise<RemedyMatch[]>;
  getRemedyDetails(remedyId: string): Promise<RemedyDetails | null>;
}

export function createRepertorySearchService(executor: RepertoryQueryExecutor): RepertorySearchService {
  return {
    async listSymptoms(book, search, limit, offset) {
      let query = 'SELECT DISTINCT text FROM symptoms WHERE book = ?';
      const params: (string | number)[] = [book];

      if (search?.trim()) {
        query += ' AND text LIKE ?';
        params.push(`%${search.trim()}%`);
      }

      query += ' ORDER BY text';

      if (limit !== undefined) {
        query += ' LIMIT ?';
        params.push(limit);
        
        if (offset !== undefined) {
          query += ' OFFSET ?';
          params.push(offset);
        }
      }

      const results = await executor.all<{ text: string }>(query, params);
      return results.map((row) => row.text);
    },

    async countSymptoms(book, search) {
      let query = 'SELECT COUNT(DISTINCT text) as count FROM symptoms WHERE book = ?';
      const params: (string | number)[] = [book];

      if (search?.trim()) {
        query += ' AND text LIKE ?';
        params.push(`%${search.trim()}%`);
      }

      const result = await executor.get<{ count: number }>(query, params);
      return result?.count ?? 0;
    },

    async suggestSymptoms(book, search, limit = 100, offset = 0) {
      const query = search.toLowerCase().trim();
      if (!query) {
        return this.listSymptoms(book, undefined, limit, offset);
      }

      const wordGroups = expandSearchTerms(query);
      const queryLength = query.length;
      
      const params: (string | number)[] = [query, queryLength, book];
      const andConditions: string[] = [];

      for (const synonyms of wordGroups) {
        const orParts = synonyms.map(() => 'lower(text) LIKE ?');
        andConditions.push(`(${orParts.join(' OR ')})`);
        synonyms.forEach(syn => params.push(`%${syn}%`));
      }

      const sqlQuery = `
        SELECT DISTINCT
          text,
          (
            1000 - (instr(lower(text), ?) - 1)
            + (? * 100.0 / NULLIF(length(text), 0))
          ) AS relevanceScore
        FROM symptoms
        WHERE book = ?
          AND ${andConditions.join(' AND ')}
        ORDER BY relevanceScore DESC, text ASC
        LIMIT ? OFFSET ?
      `;
      params.push(limit, offset);

      const results = await executor.all<{ text: string }>(sqlQuery, params);
      return results.map((row) => row.text);
    },

    async countSymptomSuggestions(book, search) {
      const query = search.toLowerCase().trim();
      if (!query) {
        return this.countSymptoms(book);
      }

      const wordGroups = expandSearchTerms(query);
      
      const params: (string | number)[] = [book];
      const andConditions: string[] = [];

      for (const synonyms of wordGroups) {
        const orParts = synonyms.map(() => 'lower(text) LIKE ?');
        andConditions.push(`(${orParts.join(' OR ')})`);
        synonyms.forEach(syn => params.push(`%${syn}%`));
      }

      const sqlQuery = `
        SELECT COUNT(DISTINCT text) as count 
        FROM symptoms 
        WHERE book = ? AND ${andConditions.join(' AND ')}
      `;

      const result = await executor.get<{ count: number }>(sqlQuery, params);
      return result?.count ?? 0;
    },

    async findRemedies(book, symptoms) {
      if (symptoms.length === 0) return [];
      
      const placeholders = symptoms.map(() => '?').join(',');
      const symptomQuery = `
        SELECT id, text FROM symptoms 
        WHERE book = ? AND text IN (${placeholders})
      `;
      
      const symptomResults = await executor.all<{ id: number; text: string }>(
        symptomQuery,
        [book, ...symptoms]
      );

      if (symptomResults.length === 0) return [];

      const symptomIdToText = new Map<number, string>();
      for (const row of symptomResults) {
        symptomIdToText.set(row.id, row.text);
      }
      const symptomIds = Array.from(symptomIdToText.keys());

      const idPlaceholders = symptomIds.map(() => '?').join(',');
      const remedyQuery = `
        SELECT r.name, r.slug, rs.symptom_id
        FROM remedies r
        JOIN remedy_symptoms rs ON r.id = rs.remedy_id
        WHERE r.book = ? AND rs.symptom_id IN (${idPlaceholders})
        ORDER BY r.name
      `;

      const remedyResults = await executor.all<{ name: string; slug: string; symptom_id: number }>(
        remedyQuery,
        [book, ...symptomIds]
      );

      const remedyMap = new Map<string, RemedyMatch>();
      for (const row of remedyResults) {
        const symptomText = symptomIdToText.get(row.symptom_id);
        if (symptomText) {
          if (!remedyMap.has(row.name)) {
            remedyMap.set(row.name, {
              remedy: row.name,
              slug: row.slug,
              matchedSymptoms: [],
            });
          }
          remedyMap.get(row.name)!.matchedSymptoms.push(symptomText);
        }
      }

      return Array.from(remedyMap.values())
        .sort((a, b) => b.matchedSymptoms.length - a.matchedSymptoms.length);
    },

    async getRemedyDetails(remedyId) {
      const parts = remedyId.split('-');
      const book = parts.pop()!;
      
      const query = `
        SELECT id, name, book
        FROM remedies
        WHERE book = ? AND slug = ?
      `;

      const row = await executor.get<{ id: number; name: string; book: string }>(query, [book, parts.join('-')]);
      if (!row) return null;

      const allSymptomsQuery = `
        SELECT s.text
        FROM symptoms s
        JOIN remedy_symptoms rs ON s.id = rs.symptom_id
        WHERE rs.remedy_id = ?
      `;
      const allSymptomsRows = await executor.all<{ text: string }>(allSymptomsQuery, [row.id]);
      const allSymptoms = allSymptomsRows.map(s => s.text);

      return {
        name: row.name,
        description: allSymptoms.join(', '),
        symptoms: allSymptoms,
        book: row.book
      };
    },

  };
}
