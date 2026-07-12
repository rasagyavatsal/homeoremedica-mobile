import { useState } from 'react';

export function useAuthSubmit() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const execute = async (
    asyncAction: () => Promise<void>,
    options?: {
      fallbackMessage?: string;
      ignoreAsyncOpInProgress?: boolean;
    }
  ) => {
    setIsLoading(true);
    setError('');
    try {
      await asyncAction();
      return true;
    } catch (err: any) {
      if (options?.ignoreAsyncOpInProgress && err.code === 'ASYNC_OP_IN_PROGRESS') {
        return false;
      }
      // Handled, user-facing auth errors (wrong password, etc.) are surfaced
      // via setError below. Log at warn level so RN's dev LogBox doesn't throw a
      // blocking red screen for an error the user already sees.
      console.warn(err);
      setError(err.message || options?.fallbackMessage || 'An unexpected error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    setError,
    execute
  };
}
