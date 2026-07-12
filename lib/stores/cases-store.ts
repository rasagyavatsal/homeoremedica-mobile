import { createCasesStore } from '@homeoremedica/shared';
import { waitForFirebaseUser } from '@/lib/auth/firebase-auth';
import { apiClient } from '@/lib/api/client';

export const useCasesStore = createCasesStore({
  apiClient,
  getToken: async () => {
    const user = await waitForFirebaseUser();
    if (!user) return null;
    return await user.getIdToken();
  },
});
