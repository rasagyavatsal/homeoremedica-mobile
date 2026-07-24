import { resolveTheme } from '@/constants/theme';

describe('resolveTheme', () => {
  it('keeps the first server and browser render light for a system preference', () => {
    expect(resolveTheme('system', 'dark', false)).toBe('light');
  });

  it('applies the system theme after hydration', () => {
    expect(resolveTheme('system', 'dark', true)).toBe('dark');
  });

  it('honors an explicit preference independently of system readiness', () => {
    expect(resolveTheme('dark', 'light', false)).toBe('dark');
  });
});
