import { renderHook, act } from '@testing-library/react-native';
import { useAuthSubmit } from '../useAuthSubmit';

describe('useAuthSubmit', () => {
  it('initial state is correct', () => {
    const { result } = renderHook(() => useAuthSubmit());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('');
  });

  it('sets loading and executes action successfully', async () => {
    const { result } = renderHook(() => useAuthSubmit());
    const action = jest.fn().mockResolvedValue(undefined);

    let success;
    await act(async () => {
      success = await result.current.execute(action);
    });

    expect(action).toHaveBeenCalled();
    expect(success).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('');
  });

  it('captures errors and sets error state', async () => {
    const { result } = renderHook(() => useAuthSubmit());
    const action = jest.fn().mockRejectedValue(new Error('Auth failed'));

    let success;
    await act(async () => {
      success = await result.current.execute(action);
    });

    expect(success).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Auth failed');
  });

  it('ignores ASYNC_OP_IN_PROGRESS if configured', async () => {
    const { result } = renderHook(() => useAuthSubmit());
    const action = jest.fn().mockRejectedValue({ code: 'ASYNC_OP_IN_PROGRESS', message: 'In progress' });

    let success;
    await act(async () => {
      success = await result.current.execute(action, { ignoreAsyncOpInProgress: true });
    });

    expect(success).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('');
  });
});
