import { ImageSourcePropType } from 'react-native';

import type { BookType } from '@/lib/database';

export type SourceBookInfo = {
  id: BookType;
  shortName: string;
  fullName: string;
  cover: ImageSourcePropType;
};

export const SOURCE_BOOKS: SourceBookInfo[] = [
  {
    id: 'clarke-MM',
    shortName: 'Clarke materia medica',
    fullName: 'A Dictionary of Practical Materia Medica by John Henry Clarke, M.D.',
    cover: require('../assets/images/source-covers/clarke.jpg'),
  },
  {
    id: 'boericke-MM',
    shortName: 'Boericke materia medica',
    fullName: 'Homeopathic Materia Medica by William Boericke, M.D.',
    cover: require('../assets/images/source-covers/boericke.jpg'),
  },
  {
    id: 'kent-lectures',
    shortName: 'Kent lectures',
    fullName: 'Lectures on Homeopathic Materia Medica by James Tyler Kent, M.D.',
    cover: require('../assets/images/source-covers/kent.jpg'),
  },
  {
    id: 'allen-nosodes',
    shortName: 'Allen nosodes',
    fullName: 'The Materia Medica of the Nosodes by Henry Clay Allen, M.D.',
    cover: require('../assets/images/source-covers/allen.jpg'),
  },
];

export function getSourceBookName(bookId: string) {
  return SOURCE_BOOKS.find(({ id }) => id === bookId)?.shortName ?? bookId;
}
