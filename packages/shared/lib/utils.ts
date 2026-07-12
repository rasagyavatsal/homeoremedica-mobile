/**
 * Converts a string (remedy name) into a URL-friendly slug.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .join('-');
}
