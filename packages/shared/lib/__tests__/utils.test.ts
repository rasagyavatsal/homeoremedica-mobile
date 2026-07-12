import { describe, it, expect } from 'vitest';
import { slugify } from '../utils';

describe('slugify', () => {
  it('converts to lowercase', () => {
    expect(slugify('ACONITUM')).toBe('aconitum');
  });

  it('replaces spaces with dashes', () => {
    expect(slugify('ABIES CANADENSIS')).toBe('abies-canadensis');
  });

  it('removes special characters', () => {
    expect(slugify('Abies Can.')).toBe('abies-can');
    expect(slugify('Arnica Mont-ana')).toBe('arnica-mont-ana');
    expect(slugify('Natrum Mur.')).toBe('natrum-mur');
  });

  it('handles multiple spaces and leading/trailing whitespace', () => {
    expect(slugify('  Arnica   Montana  ')).toBe('arnica-montana');
  });

  it('handles non-alphanumeric characters', () => {
    expect(slugify('Lyc @#$% opodium')).toBe('lyc-opodium');
  });

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('');
  });
});
