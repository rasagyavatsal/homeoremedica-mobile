import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import SelectMateriaMedicaScreen from '@/app/select-book';
import { useAppContext } from '@/context/AppContext';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

jest.mock('@/lib/haptics', () => ({
  withHaptic: (fn: () => void) => fn,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('SelectMateriaMedicaScreen', () => {
  const mockUseRouter = useRouter as jest.Mock;
  const mockUseAppContext = useAppContext as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders source cover cards and marks the active book', () => {
    mockUseRouter.mockReturnValue({
      canGoBack: () => false,
      back: jest.fn(),
      replace: jest.fn(),
    });
    mockUseAppContext.mockReturnValue({
      selectedBook: 'clarke',
      setSelectedBook: jest.fn(),
      clearSymptoms: jest.fn(),
    });

    const { getByText, getByTestId, queryByTestId } = render(<SelectMateriaMedicaScreen />);

    expect(getByText("Boericke's Materia Medica")).toBeTruthy();
    expect(getByText("Clarke's Dictionary of Practical Materia Medica")).toBeTruthy();
    expect(getByText("Kent's Lectures on Homoeopathic Materia Medica")).toBeTruthy();
    expect(getByText("Allen's Keynotes")).toBeTruthy();
    expect(getByTestId('source-cover-boericke').props.source).toBeTruthy();
    expect(getByTestId('book-option-clarke').props.accessibilityState).toEqual({ selected: true });
    expect(getByTestId('source-selected-check-clarke')).toBeTruthy();
    expect(queryByTestId('source-selected-check-boericke')).toBeNull();
  });

  it('uses a fixed source cover frame for every book image', () => {
    mockUseRouter.mockReturnValue({
      canGoBack: () => false,
      back: jest.fn(),
      replace: jest.fn(),
    });
    mockUseAppContext.mockReturnValue({
      selectedBook: 'clarke',
      setSelectedBook: jest.fn(),
      clearSymptoms: jest.fn(),
    });

    const { getByTestId } = render(<SelectMateriaMedicaScreen />);

    for (const bookId of ['boericke', 'clarke', 'kent', 'allen']) {
      const coverStyle = StyleSheet.flatten(getByTestId(`source-cover-${bookId}`).props.style);

      expect(coverStyle).toEqual(expect.objectContaining({ width: 112, height: 150 }));
      expect(coverStyle?.aspectRatio).toBeUndefined();
    }
  });

  it('uses the same fixed frame for every source grid box', () => {
    mockUseRouter.mockReturnValue({
      canGoBack: () => false,
      back: jest.fn(),
      replace: jest.fn(),
    });
    mockUseAppContext.mockReturnValue({
      selectedBook: 'clarke',
      setSelectedBook: jest.fn(),
      clearSymptoms: jest.fn(),
    });

    const { getByTestId } = render(<SelectMateriaMedicaScreen />);

    for (const bookId of ['boericke', 'clarke', 'kent', 'allen']) {
      const cardStyle = StyleSheet.flatten(getByTestId(`book-card-${bookId}`).props.style);

      expect(cardStyle).toEqual(expect.objectContaining({ height: 264 }));
    }
  });

  it('selects a book, clears symptoms, and returns home when opened directly', () => {
    const replace = jest.fn();
    const setSelectedBook = jest.fn();
    const clearSymptoms = jest.fn();

    mockUseRouter.mockReturnValue({
      canGoBack: () => false,
      back: jest.fn(),
      replace,
    });
    mockUseAppContext.mockReturnValue({
      selectedBook: 'clarke',
      setSelectedBook,
      clearSymptoms,
    });

    const { getByTestId } = render(<SelectMateriaMedicaScreen />);

    fireEvent.press(getByTestId('book-option-kent'));

    expect(setSelectedBook).toHaveBeenCalledWith('kent');
    expect(clearSymptoms).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/');
  });
});
