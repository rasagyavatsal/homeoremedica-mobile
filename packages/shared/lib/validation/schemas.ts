import { z } from 'zod';

// Request validation schemas
export const findRemedySchema = z.object({
  bookId: z.enum(['boericke', 'clarke', 'kent', 'allen']),
  symptoms: z.array(z.string().min(1)).min(1).max(20)
});

export const selectedSymptomSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  synonyms: z.array(z.string().min(1)).optional(),
  books: z.array(z.enum(['boericke', 'clarke', 'kent', 'allen'])).optional(),
  category: z.string().min(1).optional(),
});

export const caseResultSchema = z.object({
  remedyId: z.string().min(1),
  score: z.number(),
});

export const baseCaseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  name: z.string().min(1).max(200).optional(),
  note: z.string().max(2000).optional(),
  bookId: z.string().min(1).optional(),
  symptoms: z.array(z.string().min(1)).optional(),
  selectedSymptoms: z.array(selectedSymptomSchema).optional(),
  results: z.array(caseResultSchema).optional()
});

export const createCaseSchema = baseCaseSchema.superRefine((data, ctx) => {
  if (!data.title && !data.name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Either title or name must be provided',
      path: ['title']
    });
  }
});

export const updateCaseSchema = baseCaseSchema.superRefine((data, ctx) => {
  if (Object.keys(data).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one field must be provided for update'
    });
  }
});

export const aiMatchSymptomsSchema = z.object({
  query: z.string().min(1),
  selectedBooks: z.array(z.enum(['boericke', 'clarke', 'kent', 'allen'])).optional(),
});

// Response validation schemas
export const apiErrorSchema = z.object({
  code: z.enum(['AUTH_REQUIRED', 'INVALID_INPUT', 'INTERNAL_ERROR', 'NOT_FOUND']),
  message: z.string(),
  details: z.any().optional()
});

export type FindRemedyRequest = z.infer<typeof findRemedySchema>;
export type SelectedSymptom = z.infer<typeof selectedSymptomSchema>;
export type CaseResult = z.infer<typeof caseResultSchema>;
export type CreateCaseRequest = z.infer<typeof createCaseSchema>;
export type UpdateCaseRequest = z.infer<typeof updateCaseSchema>;
export type AiMatchSymptomsRequest = z.infer<typeof aiMatchSymptomsSchema>;
