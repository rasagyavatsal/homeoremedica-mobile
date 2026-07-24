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
      selectedBook: 'clarke-MM',
      setSelectedBook: jest.fn(),
      clearSymptoms: jest.fn(),
    });

    const { getByText, getByTestId, queryByTestId } = render(<SelectMateriaMedicaScreen />);

    expect(getByText('Homeopathic Materia Medica by William Boericke, M.D.')).toBeTruthy();
    expect(
      getByText('A Dictionary of Practical Materia Medica by John Henry Clarke, M.D.'),
    ).toBeTruthy();
    expect(
      getByText('Lectures on Homeopathic Materia Medica by James Tyler Kent, M.D.'),
    ).toBeTruthy();
    expect(
      getByText('The Materia Medica of the Nosodes by Henry Clay Allen, M.D.'),
    ).toBeTruthy();
    expect(getByTestId('source-cover-boericke-MM').props.source).toBeTruthy();
    expect(getByTestId('book-option-clarke-MM').props.accessibilityState).toEqual({ selected: true });
    expect(getByTestId('source-selected-check-clarke-MM')).toBeTruthy();
    expect(queryByTestId('source-selected-check-boericke-MM')).toBeNull();
  });

  it('uses the compact source cover frame from the web picker', () => {
    mockUseRouter.mockReturnValue({
      canGoBack: () => false,
      back: jest.fn(),
      replace: jest.fn(),
    });
    mockUseAppContext.mockReturnValue({
      selectedBook: 'clarke-MM',
      setSelectedBook: jest.fn(),
      clearSymptoms: jest.fn(),
    });

    const { getByTestId } = render(<SelectMateriaMedicaScreen />);

    for (const bookId of ['boericke-MM', 'clarke-MM', 'kent-lectures', 'allen-nosodes']) {
      const coverStyle = StyleSheet.flatten(getByTestId(`source-cover-${bookId}`).props.style);

      expect(coverStyle).toEqual(expect.objectContaining({ width: 80, height: 112 }));
      expect(coverStyle?.aspectRatio).toBeUndefined();
    }
  });

  it('uses the same compact frame for every source grid box', () => {
    mockUseRouter.mockReturnValue({
      canGoBack: () => false,
      back: jest.fn(),
      replace: jest.fn(),
    });
    mockUseAppContext.mockReturnValue({
      selectedBook: 'clarke-MM',
      setSelectedBook: jest.fn(),
      clearSymptoms: jest.fn(),
    });

    const { getByTestId } = render(<SelectMateriaMedicaScreen />);

    for (const bookId of ['boericke-MM', 'clarke-MM', 'kent-lectures', 'allen-nosodes']) {
      const cardStyle = StyleSheet.flatten(getByTestId(`book-card-${bookId}`).props.style);

      expect(cardStyle).toEqual(expect.objectContaining({ height: 224 }));
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
      selectedBook: 'clarke-MM',
      setSelectedBook,
      clearSymptoms,
    });

    const { getByTestId } = render(<SelectMateriaMedicaScreen />);

    fireEvent.press(getByTestId('book-option-kent-lectures'));

    expect(setSelectedBook).toHaveBeenCalledWith('kent-lectures');
    expect(clearSymptoms).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/');
  });

  it('confirms before changing the source for an active search', () => {
    const back = jest.fn();
    const setSelectedBook = jest.fn();
    const clearSymptoms = jest.fn();

    mockUseRouter.mockReturnValue({
      canGoBack: () => true,
      back,
      replace: jest.fn(),
    });
    mockUseAppContext.mockReturnValue({
      selectedBook: 'clarke-MM',
      selectedSymptoms: ['Head pain'],
      setSelectedBook,
      clearSymptoms,
    });

    const { getByTestId, getByText } = render(<SelectMateriaMedicaScreen />);

    fireEvent.press(getByTestId('book-option-kent-lectures'));

    expect(getByText('Change source?')).toBeTruthy();
    expect(getByText('Changing the source will clear the current search.')).toBeTruthy();
    expect(setSelectedBook).not.toHaveBeenCalled();

    fireEvent.press(getByText('Change source'));

    expect(setSelectedBook).toHaveBeenCalledWith('kent-lectures');
    expect(clearSymptoms).toHaveBeenCalledTimes(1);
    expect(back).toHaveBeenCalledTimes(1);
  });

  it('returns home when the active source is reselected without history', () => {
    const replace = jest.fn();
    const setSelectedBook = jest.fn();
    const clearSymptoms = jest.fn();

    mockUseRouter.mockReturnValue({
      canGoBack: () => false,
      back: jest.fn(),
      replace,
    });
    mockUseAppContext.mockReturnValue({
      selectedBook: 'clarke-MM',
      selectedSymptoms: [],
      setSelectedBook,
      clearSymptoms,
    });

    const { getByTestId } = render(<SelectMateriaMedicaScreen />);

    fireEvent.press(getByTestId('book-option-clarke-MM'));

    expect(replace).toHaveBeenCalledWith('/');
    expect(setSelectedBook).not.toHaveBeenCalled();
    expect(clearSymptoms).not.toHaveBeenCalled();
  });
});
