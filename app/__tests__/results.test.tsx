import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ResultsScreen from '../results';
import { useAppContext } from '@/context/AppContext';
import { useAuthStore } from '@/lib/stores/auth-store';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/lib/stores/cases-store', () => ({
  useCasesStore: () => ({
    addCase: jest.fn(),
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('ResultsScreen', () => {
  const mockUseAppContext = useAppContext as jest.Mock;
  const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppContext.mockReturnValue({
      findRemediesAsync: jest.fn().mockResolvedValue([
        {
          remedy: 'Belladonna',
          slug: 'belladonna',
          matchedSymptoms: ['headache'],
        },
      ]),
      selectedSymptoms: ['headache'],
      selectedBook: 'boericke',
      isDbReady: true,
    });
    mockUseAuthStore.mockReturnValue({
      user: { email: 'test@example.com', name: 'Test User' },
    });
  });

  it('does not render helper copy in the save-case modal', async () => {
    const { findByText, getByText, queryByText } = render(<ResultsScreen />);

    expect(await findByText('Belladonna')).toBeTruthy();
    fireEvent.press(getByText('Save case'));

    await waitFor(() => expect(getByText('Case name')).toBeTruthy());
    expect(queryByText('Name this case to save it to your account.')).toBeNull();
  });

  it('renders remedy matches as non-navigable reference results', async () => {
    const { findByText, queryByRole } = render(<ResultsScreen />);

    expect(await findByText('Belladonna')).toBeTruthy();
    expect(queryByRole('button', { name: /Belladonna/ })).toBeNull();
  });
});
