import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler.middleware';

interface GetWordsQuery {
  search?: string;
  isFavorite?: boolean;
  sortBy?: 'word' | 'createdAt' | 'nextReviewAt';
  order?: 'asc' | 'desc';
}

export async function getWords(wordbookId: number, userId: number, query: GetWordsQuery) {
  const book = await prisma.wordbook.findFirst({ where: { id: wordbookId, userId } });
  if (!book) throw new AppError(404, 'Wordbook not found');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { wordbookId, userId };

  if (query.search) {
    where.OR = [
      { word: { contains: query.search } },
      { meaning: { contains: query.search } },
    ];
  }
  if (query.isFavorite !== undefined) where.isFavorite = query.isFavorite;

  const sortBy = query.sortBy || 'createdAt';
  const order = query.order || 'desc';

  return prisma.word.findMany({
    where,
    orderBy: { [sortBy]: order },
  });
}

export async function createWord(
  wordbookId: number,
  userId: number,
  data: { word: string; meaning: string; example?: string }
) {
  const book = await prisma.wordbook.findFirst({ where: { id: wordbookId, userId } });
  if (!book) throw new AppError(404, 'Wordbook not found');

  return prisma.word.create({
    data: { ...data, wordbookId, userId },
  });
}

export async function createWords(
  wordbookId: number,
  userId: number,
  words: Array<{ word: string; meaning: string; example?: string }>
) {
  const book = await prisma.wordbook.findFirst({ where: { id: wordbookId, userId } });
  if (!book) throw new AppError(404, 'Wordbook not found');

  return prisma.word.createMany({
    data: words.map((w) => ({ ...w, wordbookId, userId })),
  });
}

export async function updateWord(
  id: number,
  userId: number,
  data: { word?: string; meaning?: string; example?: string }
) {
  const word = await prisma.word.findFirst({ where: { id, userId } });
  if (!word) throw new AppError(404, 'Word not found');
  return prisma.word.update({ where: { id }, data });
}

export async function deleteWord(id: number, userId: number) {
  const word = await prisma.word.findFirst({ where: { id, userId } });
  if (!word) throw new AppError(404, 'Word not found');
  await prisma.word.delete({ where: { id } });
}

export async function patchFavorite(id: number, userId: number, isFavorite: boolean) {
  const word = await prisma.word.findFirst({ where: { id, userId } });
  if (!word) throw new AppError(404, 'Word not found');
  return prisma.word.update({ where: { id }, data: { isFavorite } });
}

