import type { BookId } from '@/types';

const SOURCE_BOOK_NAMES: Record<BookId, string> = {
  'clarke-MM': 'Clarke materia medica',
  'boericke-MM': 'Boericke materia medica',
  'kent-lectures': 'Kent lectures',
  'allen-nosodes': 'Allen nosodes',
};

export function getSourceBookName(bookId: string) {
  return SOURCE_BOOK_NAMES[bookId as BookId] ?? bookId;
}
