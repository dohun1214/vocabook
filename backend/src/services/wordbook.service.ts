import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler.middleware';

export async function getWordbooks(userId: number) {
  const wordbooks = await prisma.wordbook.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { words: true } },
    },
  });

  return wordbooks.map((wb: typeof wordbooks[number]) => ({
    id: wb.id,
    userId: wb.userId,
    name: wb.name,
    createdAt: wb.createdAt,
    updatedAt: wb.updatedAt,
    wordCount: wb._count.words,
  }));
}

export async function createWordbook(userId: number, name: string) {
  return prisma.wordbook.create({
    data: { userId, name },
  });
}

export async function updateWordbook(id: number, userId: number, name: string) {
  const book = await prisma.wordbook.findFirst({ where: { id, userId } });
  if (!book) throw new AppError(404, 'Wordbook not found');
  return prisma.wordbook.update({ where: { id }, data: { name } });
}

export async function deleteWordbook(id: number, userId: number) {
  const book = await prisma.wordbook.findFirst({ where: { id, userId } });
  if (!book) throw new AppError(404, 'Wordbook not found');
  await prisma.wordbook.delete({ where: { id } });
}
