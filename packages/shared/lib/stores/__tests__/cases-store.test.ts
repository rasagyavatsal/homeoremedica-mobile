import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCasesStore, isNonEmptyString, normalizeCaseFromApi, isValidCase } from '../cases-store';

describe('cases-store utilities', () => {
  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('test')).toBe(true);
      expect(isNonEmptyString('  test  ')).toBe(true);
    });

    it('should return false for empty or whitespace-only strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString({})).toBe(false);
    });
  });

  describe('normalizeCaseFromApi', () => {
    it('should normalize valid API data', () => {
      const now = new Date().toISOString();
      const apiData = {
        id: '1',
        name: 'Case 1',
        bookId: 'boericke',
        selectedSymptoms: [{ id: 's1', name: 'Symptom 1' }],
        userId: 'u1',
        createdAt: now
      };
      
      const result = normalizeCaseFromApi(apiData);
      expect(result).toEqual({
        id: '1',
        name: 'Case 1',
        bookId: 'boericke',
        selectedSymptoms: [{ id: 's1', name: 'Symptom 1' }],
        userId: 'u1',
        timestamp: new Date(now)
      });
    });

    it('should use title if name is missing', () => {
      const apiData = { id: '1', title: 'Title', createdAt: new Date().toISOString() };
      const result = normalizeCaseFromApi(apiData);
      expect(result?.name).toBe('Title');
    });

    it('should return null if ID is missing', () => {
      expect(normalizeCaseFromApi({ name: 'No ID' })).toBeNull();
    });
  });

  describe('isValidCase', () => {
    it('should validate a correct case object', () => {
      expect(isValidCase({ id: '1' })).toBe(true);
    });

    it('should reject invalid case objects', () => {
      expect(isValidCase(null)).toBe(false);
      expect(isValidCase({})).toBe(false);
      expect(isValidCase({ id: '' })).toBe(false);
    });
  });
});

describe('cases-store', () => {
  let mockApiClient: any;
  let mockGetToken: any;

  beforeEach(() => {
    mockApiClient = {
      setAuthToken: vi.fn(),
      getCases: vi.fn().mockResolvedValue({ cases: [] }),
      createCase: vi.fn(),
      updateCase: vi.fn(),
      deleteCase: vi.fn(),
    };

    mockGetToken = vi.fn().mockResolvedValue('test-token');
  });

  it('should initialize with default state', () => {
    const useCasesStore = createCasesStore({
      apiClient: mockApiClient,
      getToken: mockGetToken,
    });
    
    const state = useCasesStore.getState();
    expect(state.cases).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.selectedCase).toBeNull();
  });

  it('should load cases successfully', async () => {
    const mockCases = [
      { id: '1', name: 'Case 1', userId: 'user1', createdAt: new Date().toISOString() },
      { id: '2', title: 'Case 2', userId: 'user1', timestamp: new Date().toISOString() },
    ];
    mockApiClient.getCases.mockResolvedValue({ cases: mockCases });

    const useCasesStore = createCasesStore({
      apiClient: mockApiClient,
      getToken: mockGetToken,
    });

    await useCasesStore.getState().loadUserCases();

    const state = useCasesStore.getState();
    expect(state.cases).toHaveLength(2);
    expect(state.cases[0].id).toBe('1');
    expect(state.cases[0].name).toBe('Case 1');
    expect(state.cases[1].id).toBe('2');
    expect(state.cases[1].name).toBe('Case 2');
    expect(state.loading).toBe(false);
    expect(mockApiClient.setAuthToken).toHaveBeenCalledWith('test-token');
  });

  it('should add a case successfully', async () => {
    const newCaseData = { id: '3', name: 'New Case', userId: 'user1', createdAt: new Date().toISOString() };
    mockApiClient.createCase.mockResolvedValue(newCaseData);

    const useCasesStore = createCasesStore({
      apiClient: mockApiClient,
      getToken: mockGetToken,
    });

    await useCasesStore.getState().addCase('New Case', []);

    const state = useCasesStore.getState();
    expect(state.cases).toHaveLength(1);
    expect(state.cases[0].id).toBe('3');
    expect(state.selectedCase?.id).toBe('3');
  });

  it('should handle load errors', async () => {
    mockApiClient.getCases.mockRejectedValue(new Error('Network error'));

    const useCasesStore = createCasesStore({
      apiClient: mockApiClient,
      getToken: mockGetToken,
    });

    await useCasesStore.getState().loadUserCases();

    const state = useCasesStore.getState();
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Network error');
  });

  it('should update a case successfully', async () => {
    const useCasesStore = createCasesStore({
      apiClient: mockApiClient,
      getToken: mockGetToken,
    });

    const initialCase = { id: '1', name: 'Old Name', userId: 'u1', timestamp: new Date() };
    useCasesStore.setState({ cases: [initialCase] });

    const updatedData = { id: '1', name: 'New Name', userId: 'u1', createdAt: new Date().toISOString() };
    mockApiClient.updateCase.mockResolvedValue(updatedData);

    await useCasesStore.getState().updateCase('1', { name: 'New Name' });

    const state = useCasesStore.getState();
    expect(state.cases[0].name).toBe('New Name');
    expect(mockApiClient.updateCase).toHaveBeenCalledWith('1', { name: 'New Name' });
  });

  it('should handle update errors', async () => {
    mockApiClient.updateCase.mockRejectedValue(new Error('Update failed'));

    const useCasesStore = createCasesStore({
      apiClient: mockApiClient,
      getToken: mockGetToken,
    });

    await expect(useCasesStore.getState().updateCase('1', { name: 'New Name' }))
      .rejects.toThrow('Update failed');
  });

  it('should delete a case successfully', async () => {
    const useCasesStore = createCasesStore({
      apiClient: mockApiClient,
      getToken: mockGetToken,
    });

    const initialCases = [
      { id: '1', name: 'Case 1', userId: 'u1', timestamp: new Date() },
      { id: '2', name: 'Case 2', userId: 'u1', timestamp: new Date() },
    ];
    useCasesStore.setState({ cases: initialCases, selectedCase: initialCases[0] });

    await useCasesStore.getState().deleteCase('1');

    const state = useCasesStore.getState();
    expect(state.cases).toHaveLength(1);
    expect(state.cases[0].id).toBe('2');
    expect(state.selectedCase).toBeNull();
    expect(mockApiClient.deleteCase).toHaveBeenCalledWith('1');
  });

  it('should throw and clean state on invalid delete ID', async () => {
    const useCasesStore = createCasesStore({
      apiClient: mockApiClient,
      getToken: mockGetToken,
    });

    useCasesStore.setState({ cases: [{ id: '' } as any] });

    await expect(useCasesStore.getState().deleteCase(''))
      .rejects.toThrow('Invalid case ID');
    
    expect(useCasesStore.getState().cases).toHaveLength(0);
  });

  it('should select a case by ID', () => {
    const useCasesStore = createCasesStore({
      apiClient: mockApiClient,
      getToken: mockGetToken,
    });

    const cases = [{ id: '1', name: 'C1' }, { id: '2', name: 'C2' }] as any;
    useCasesStore.setState({ cases });

    useCasesStore.getState().selectCase('2');
    expect(useCasesStore.getState().selectedCase?.id).toBe('2');

    useCasesStore.getState().selectCase(null);
    expect(useCasesStore.getState().selectedCase).toBeNull();

    useCasesStore.getState().selectCase('non-existent');
    expect(useCasesStore.getState().selectedCase).toBeNull();
  });

  it('should clear cases', () => {
    const useCasesStore = createCasesStore({
      apiClient: mockApiClient,
      getToken: mockGetToken,
    });

    useCasesStore.setState({ 
      cases: [{ id: '1' }] as any, 
      selectedCase: { id: '1' } as any,
      error: 'some error'
    });

    useCasesStore.getState().clearCases();

    const state = useCasesStore.getState();
    expect(state.cases).toEqual([]);
    expect(state.selectedCase).toBeNull();
    expect(state.error).toBeNull();
  });
});
