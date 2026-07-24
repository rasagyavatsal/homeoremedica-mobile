import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import FindRemedyScreen from '../index';
import { useAppContext } from '@/context/AppContext';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('@/context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: () => ({ user: null }),
}));

jest.mock('@/lib/stores/cases-store', () => ({
  useCasesStore: () => ({ addCase: jest.fn() }),
}));

jest.mock('@/lib/haptics', () => ({
  withHaptic: (handler: () => void) => handler,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('FindRemedyScreen', () => {
  const contextWithResults = (findRemediesAsync: jest.Mock) => ({
    selectedBook: 'boericke-MM',
    selectedSymptoms: ['Head pain'],
    toggleSymptom: jest.fn(),
    clearSymptoms: jest.fn(),
    searchSymptomsAsync: jest.fn(),
    getSymptomsCountAsync: jest.fn(),
    findRemediesAsync,
    isDbReady: true,
    dbError: null,
  });

  it('shows ranked remedies in the finder workspace when symptoms are selected', async () => {
    const findRemediesAsync = jest.fn().mockResolvedValue([
      {
        remedy: 'Belladonna',
        slug: 'belladonna',
        matchedSymptoms: ['Head pain'],
      },
    ]);

    (useAppContext as jest.Mock).mockReturnValue(contextWithResults(findRemediesAsync));

    const { findByText, getByPlaceholderText } = render(<FindRemedyScreen />);

    expect(getByPlaceholderText('Search symptom keywords…')).toBeTruthy();
    expect(await findByText('Matching remedies')).toBeTruthy();
    expect(await findByText('Belladonna')).toBeTruthy();
    expect(await findByText('Matches 1 of 1')).toBeTruthy();
    await waitFor(() => expect(findRemediesAsync).toHaveBeenCalledTimes(1));
  });

  it('shows a terminal state when no remedies match', async () => {
    const findRemediesAsync = jest.fn().mockResolvedValue([]);
    (useAppContext as jest.Mock).mockReturnValue(contextWithResults(findRemediesAsync));

    const { findByText } = render(<FindRemedyScreen />);

    expect(await findByText('No remedies found')).toBeTruthy();
    expect(
      await findByText('Nothing in Boericke materia medica matches these symptoms.'),
    ).toBeTruthy();
  });

  it('distinguishes a failed match request from an empty result', async () => {
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const findRemediesAsync = jest.fn().mockRejectedValue(new Error('Network unavailable'));
    (useAppContext as jest.Mock).mockReturnValue(contextWithResults(findRemediesAsync));

    const { findByText, queryByText } = render(<FindRemedyScreen />);

    expect(await findByText('Unable to find remedies')).toBeTruthy();
    expect(queryByText('No remedies found')).toBeNull();
    errorLog.mockRestore();
  });
});
