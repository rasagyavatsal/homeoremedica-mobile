import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCasesStore } from '../cases-store';
import { ApiClient } from '../../api/client';

describe('CasesStore Integration with Zod Validation', () => {
  let mockApiClient: ApiClient;
  let mockGetToken: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiClient = new ApiClient('http://test.com');
    // Mock the request method to intercept calls
    vi.spyOn(mockApiClient as any, 'request').mockResolvedValue({});
    mockGetToken = vi.fn().mockResolvedValue('test-token');
  });

  it('should prevent adding a case with empty patient name', async () => {
    const useCasesStore = createCasesStore({
      apiClient: mockApiClient,
      getToken: mockGetToken,
    });

    // Attempting to add with an empty name should fail Zod validation in ApiClient
    await expect(useCasesStore.getState().addCase('', []))
      .rejects.toThrow();

    // Verify API was never called because validation failed first
    expect((mockApiClient as any).request).not.toHaveBeenCalled();
  });

  it('should allow adding a case with no symptoms (optional in schema)', async () => {
    const useCasesStore = createCasesStore({
      apiClient: mockApiClient,
      getToken: mockGetToken,
    });

    const mockResponse = { id: 'case-123', name: 'John Doe', userId: 'u1', createdAt: new Date().toISOString() };
    vi.spyOn(mockApiClient as any, 'request').mockResolvedValue(mockResponse);

    await useCasesStore.getState().addCase('John Doe', []);

    // It should NOT throw because symptoms are optional in baseCaseSchema
    expect((mockApiClient as any).request).toHaveBeenCalled();
  });

  it('should prevent adding a case with invalid data types', async () => {
    const useCasesStore = createCasesStore({
      apiClient: mockApiClient,
      getToken: mockGetToken,
    });

    // name is too long (max 200)
    const longName = 'a'.repeat(201);
    await expect(useCasesStore.getState().addCase(longName, []))
      .rejects.toThrow();

    expect((mockApiClient as any).request).not.toHaveBeenCalled();
  });

  it('should successfully call API when data is valid', async () => {
    const useCasesStore = createCasesStore({
      apiClient: mockApiClient,
      getToken: mockGetToken,
    });

    const mockResponse = { id: 'case-123', name: 'Valid Case', userId: 'u1', createdAt: new Date().toISOString() };
    vi.spyOn(mockApiClient as any, 'request').mockResolvedValue(mockResponse);

    await useCasesStore.getState().addCase('Valid Patient', [{ id: 's1', name: 'headache' }]);

    expect((mockApiClient as any).request).toHaveBeenCalledWith(
      '/cases',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
