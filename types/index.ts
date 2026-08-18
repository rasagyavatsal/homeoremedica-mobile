import type { z } from 'zod';
import { bookIdSchema } from '../lib/validation/schemas';

export type BookId = z.infer<typeof bookIdSchema>;

export interface User {
  id: string;
  email: string;
  name?: string;
}
