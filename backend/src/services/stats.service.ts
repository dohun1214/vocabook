import { prisma } from '../lib/prisma';

export async function getStats(userId: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalWords,
    favoriteWords,
    totalLogs,
    correctLogs,
    todayLogs,
    recentLogs,
    wordbooks,
  ] = await Promise.all([
    prisma.word.count({ where: { userId } }),
    prisma.word.count({ where: { userId, isFavorite: true } }),
    prisma.studyLog.count({ where: { userId } }),
    prisma.studyLog.count({ where: { userId, result: 'CORRECT' } }),
    prisma.studyLog.count({ where: { userId, studiedAt: { gte: today } } }),
    prisma.studyLog.findMany({
      where: { userId, studiedAt: { gte: thirtyDaysAgo } },
      select: { studiedAt: true },
      orderBy: { studiedAt: 'desc' },
    }),
    prisma.wordbook.findMany({
      where: { userId },
      include: { _count: { select: { words: true } } },
    }),
  ]);

  // Streak calculation: count consecutive days backwards from today
  const studiedDays = new Set(
    recentLogs.map((log: { studiedAt: Date }) => log.studiedAt.toISOString().split('T')[0])
  );

  let streak = 0;
  const checkDate = new Date();
  for (let i = 0; i < 30; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (studiedDays.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // If today has no study yet, skip today and check yesterday
      if (i === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      break;
    }
  }

  const accuracy = totalLogs > 0 ? Math.round((correctLogs / totalLogs) * 100) : 0;

  const wordbookStats = wordbooks.map((wb: typeof wordbooks[number]) => ({
    id: wb.id,
    name: wb.name,
    wordCount: wb._count.words,
  }));

  return {
    words: {
      total: totalWords,
      favorite: favoriteWords,
    },
    study: {
      total: totalLogs,
      todayCount: todayLogs,
      accuracy,
      streak,
    },
    wordbooks: wordbookStats,
  };
}
