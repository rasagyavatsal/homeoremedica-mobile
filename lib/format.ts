/*
 * Source data stores remedy names in ledger caps ("ARSENICUM ALBUM").
 * Serif display contexts read better in title case; the underlying data is
 * left untouched. Mirrors apps/web/lib/utils.ts:formatRemedyDisplayName so the
 * two apps render remedy names identically.
 */
export function formatRemedyDisplayName(name: string): string {
  return name
    .toLowerCase()
    .replace(
      /(^|[\s\-–—(."'/])(\p{L})/gu,
      (_, boundary: string, letter: string) => `${boundary}${letter.toUpperCase()}`,
    );
}
