import { apiClient } from '@/lib/api/client';
import { waitForFirebaseUser } from '@/lib/auth/firebase-auth';
import { createCasesStore } from './create-cases-store';

export const useCasesStore = createCasesStore({
  apiClient,
  getToken: async () => {
    const user = await waitForFirebaseUser();
    return user ? user.getIdToken() : null;
  },
});
