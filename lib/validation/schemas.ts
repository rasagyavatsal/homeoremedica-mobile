import { z } from 'zod';

export const BOOK_IDS = [
  'clarke-MM',
  'boericke-MM',
  'kent-lectures',
  'allen-nosodes',
] as const;

export const bookIdSchema = z.enum(BOOK_IDS);

// Grounded chat request, matching the RAG backend limits (4000-char turns, 20-turn history).
export const chatTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(4000),
});

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  history: z.array(chatTurnSchema).max(20).optional(),
  bookIds: z
    .array(bookIdSchema)
    .min(1)
    .max(4)
    .refine((bookIds) => new Set(bookIds).size === bookIds.length, {
      message: 'bookIds must not contain duplicates',
    })
    .optional(),
});

// Response validation schemas
export const apiErrorSchema = z.object({
  code: z.enum([
    'APP_CHECK_REQUIRED',
    'AUTH_REQUIRED',
    'INVALID_INPUT',
    'INTERNAL_ERROR',
    'NOT_FOUND',
    'UPSTREAM_UNAVAILABLE',
  ]),
  message: z.string(),
  details: z.any().optional()
});

export type ChatApiRequest = z.infer<typeof chatRequestSchema>;
