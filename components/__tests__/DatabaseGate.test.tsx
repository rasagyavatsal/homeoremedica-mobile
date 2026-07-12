import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { DatabaseGate } from '../DatabaseGate';
import { useAppContext } from '@/context/AppContext';

// Mock useAppContext
jest.mock('@/context/AppContext');

describe('DatabaseGate', () => {
  const mockUseAppContext = useAppContext as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when database is ready and has no errors', () => {
    mockUseAppContext.mockReturnValue({
      isDbReady: true,
      dbError: null,
    });

    const { getByText } = render(
      <DatabaseGate>
        <Text>App Content</Text>
      </DatabaseGate>
    );

    expect(getByText('App Content')).toBeTruthy();
  });

  it('renders LoadingState when database is not ready', () => {
    mockUseAppContext.mockReturnValue({
      isDbReady: false,
      dbError: null,
    });

    const { getByText } = render(
      <DatabaseGate loadingText="Initializing db...">
        <Text>App Content</Text>
      </DatabaseGate>
    );

    expect(getByText('Initializing db...')).toBeTruthy();
  });

  it('renders ErrorState when database has error', () => {
    mockUseAppContext.mockReturnValue({
      isDbReady: true,
      dbError: 'Connection failed',
    });

    const { getByText } = render(
      <DatabaseGate>
        <Text>App Content</Text>
      </DatabaseGate>
    );

    expect(getByText('Database Error')).toBeTruthy();
    expect(getByText('Connection failed')).toBeTruthy();
  });
});
