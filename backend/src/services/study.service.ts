import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler.middleware';

type StudyMode = 'FLASHCARD' | 'QUIZ_MULTIPLE' | 'QUIZ_SHORT';
type StudyResult = 'CORRECT' | 'INCORRECT';

interface SpacedRepetitionResult {
  interval: number;
  easeFactor: number;
  nextReviewAt: Date;
}

/**
 * SM-2 Algorithm
 * quality 0-1: wrong  → reset interval to 1, degrade easeFactor
 * quality 2-5: correct → advance interval, update easeFactor
 *
 * easeFactor = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 * easeFactor minimum: 1.3
 * interval: rep0 → 1, rep1 → 6, rep2+ → round(interval * ef)
 */
function applySpacedRepetition(
  quality: number,
  currentInterval: number,
  currentEaseFactor: number,
  successCount: number
): SpacedRepetitionResult {
  let interval: number;
  let easeFactor = currentEaseFactor;

  if (quality <= 1) {
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);

    if (successCount === 0) {
      interval = 1;
    } else if (successCount === 1) {
      interval = 6;
    } else {
      interval = Math.round(currentInterval * easeFactor);
    }
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);
  nextReviewAt.setHours(0, 0, 0, 0); // normalize to midnight

  return { interval, easeFactor, nextReviewAt };
}

export async function getTodayWords(userId: number) {
  const now = new Date();
  return prisma.word.findMany({
    where: {
      userId,
      isMemorized: false,
      nextReviewAt: { lte: now },
    },
    orderBy: { nextReviewAt: 'asc' },
    take: 20,
  });
}

export async function logStudy(
  userId: number,
  wordId: number,
  mode: StudyMode,
  result: StudyResult
) {
  const word = await prisma.word.findFirst({ where: { id: wordId, userId } });
  if (!word) throw new AppError(404, 'Word not found');

  return prisma.studyLog.create({
    data: { userId, wordId, mode, result, studiedAt: new Date() },
  });
}

export async function reviewWord(userId: number, wordId: number, quality: number) {
  if (quality < 0 || quality > 5) throw new AppError(400, 'quality must be between 0 and 5');

  const word = await prisma.word.findFirst({ where: { id: wordId, userId } });
  if (!word) throw new AppError(404, 'Word not found');

  const successCount = await prisma.studyLog.count({
    where: { wordId, userId, result: 'CORRECT' },
  });

  const { interval, easeFactor, nextReviewAt } = applySpacedRepetition(
    quality,
    word.interval,
    word.easeFactor,
    successCount
  );

  return prisma.word.update({
    where: { id: wordId },
    data: { interval, easeFactor, nextReviewAt },
  });
}
