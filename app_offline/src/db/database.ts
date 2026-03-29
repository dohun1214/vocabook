import * as SQLite from 'expo-sqlite';
import { Wordbook, Word, Stats } from '../types';

let db: SQLite.SQLiteDatabase;

export function initDB() {
  db = SQLite.openDatabaseSync('vocabulary.db');
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS wordbooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wordbookId INTEGER NOT NULL,
      word TEXT NOT NULL,
      meaning TEXT NOT NULL,
      example TEXT DEFAULT '',
      isFavorite INTEGER NOT NULL DEFAULT 0,
      isMemorized INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (wordbookId) REFERENCES wordbooks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS study_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wordId INTEGER NOT NULL,
      mode TEXT NOT NULL,
      result TEXT NOT NULL,
      studiedAt TEXT NOT NULL
    );
  `);
}

function now(): string {
  return new Date().toISOString();
}

function mapWord(row: any): Word {
  return {
    id: row.id,
    wordbookId: row.wordbookId,
    word: row.word,
    meaning: row.meaning,
    example: row.example || undefined,
    isFavorite: row.isFavorite === 1,
    isMemorized: row.isMemorized === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ─── Wordbooks ───────────────────────────────────────────────────────────────

export function getWordbooks(): Wordbook[] {
  const rows = db.getAllSync<any>(`
    SELECT wb.id, wb.name, wb.createdAt, wb.updatedAt,
           COUNT(w.id) as wordCount
    FROM wordbooks wb
    LEFT JOIN words w ON w.wordbookId = wb.id
    GROUP BY wb.id
    ORDER BY wb.createdAt DESC
  `);
  return rows.map((r) => ({ ...r, wordCount: r.wordCount ?? 0 }));
}

export function createWordbook(name: string): Wordbook {
  const t = now();
  const result = db.runSync(
    'INSERT INTO wordbooks (name, createdAt, updatedAt) VALUES (?, ?, ?)',
    [name, t, t]
  );
  return { id: result.lastInsertRowId as number, name, wordCount: 0, createdAt: t, updatedAt: t };
}

export function updateWordbook(id: number, name: string): void {
  db.runSync(
    'UPDATE wordbooks SET name = ?, updatedAt = ? WHERE id = ?',
    [name, now(), id]
  );
}

export function deleteWordbook(id: number): void {
  db.runSync('DELETE FROM wordbooks WHERE id = ?', [id]);
}

// ─── Words ────────────────────────────────────────────────────────────────────

export function getWords(
  wordbookId: number,
  opts: {
    search?: string;
    isFavorite?: boolean;
    isMemorized?: boolean;
    sortBy?: 'createdAt' | 'word';
  } = {}
): Word[] {
  const { search, isFavorite, sortBy = 'createdAt' } = opts;
  const params: any[] = [wordbookId];
  let where = 'WHERE wordbookId = ?';

  if (search) {
    where += ' AND (word LIKE ? OR meaning LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (isFavorite === true) {
    where += ' AND isFavorite = 1';
  }

  const order = sortBy === 'word' ? 'word ASC' : 'createdAt DESC';
  const rows = db.getAllSync<any>(`SELECT * FROM words ${where} ORDER BY ${order}`, params);
  return rows.map(mapWord);
}

export function getAllWords(): Word[] {
  const rows = db.getAllSync<any>('SELECT * FROM words ORDER BY createdAt DESC');
  return rows.map(mapWord);
}

export function getFavoriteWords(): (Word & { wordbookName: string })[] {
  const rows = db.getAllSync<any>(`
    SELECT w.*, wb.name as wordbookName
    FROM words w
    JOIN wordbooks wb ON wb.id = w.wordbookId
    WHERE w.isFavorite = 1
    ORDER BY w.word ASC
  `);
  return rows.map((r) => ({ ...mapWord(r), wordbookName: r.wordbookName }));
}

export function searchAllWords(query: string): (Word & { wordbookName: string; wordbookId: number })[] {
  const rows = db.getAllSync<any>(`
    SELECT w.*, wb.name as wordbookName
    FROM words w
    JOIN wordbooks wb ON wb.id = w.wordbookId
    WHERE w.word LIKE ? OR w.meaning LIKE ?
    ORDER BY w.word ASC
  `, [`%${query}%`, `%${query}%`]);
  return rows.map((r) => ({ ...mapWord(r), wordbookName: r.wordbookName, wordbookId: r.wordbookId }));
}

export function createWord(
  wordbookId: number,
  word: string,
  meaning: string,
  example?: string
): Word {
  const t = now();
  const result = db.runSync(
    'INSERT INTO words (wordbookId, word, meaning, example, isFavorite, isMemorized, createdAt, updatedAt) VALUES (?, ?, ?, ?, 0, 0, ?, ?)',
    [wordbookId, word, meaning, example || '', t, t]
  );
  return {
    id: result.lastInsertRowId as number,
    wordbookId,
    word,
    meaning,
    example: example || undefined,
    isFavorite: false,
    isMemorized: false,
    createdAt: t,
    updatedAt: t,
  };
}

export function createWords(
  wordbookId: number,
  words: { word: string; meaning: string; example?: string }[]
): void {
  const t = now();
  for (const w of words) {
    db.runSync(
      'INSERT INTO words (wordbookId, word, meaning, example, isFavorite, isMemorized, createdAt, updatedAt) VALUES (?, ?, ?, ?, 0, 0, ?, ?)',
      [wordbookId, w.word, w.meaning, w.example || '', t, t]
    );
  }
}

export function updateWord(id: number, word: string, meaning: string, example?: string): void {
  db.runSync(
    'UPDATE words SET word = ?, meaning = ?, example = ?, updatedAt = ? WHERE id = ?',
    [word, meaning, example || '', now(), id]
  );
}

export function deleteWord(id: number): void {
  db.runSync('DELETE FROM words WHERE id = ?', [id]);
}

export function setFavorite(id: number, isFavorite: boolean): void {
  db.runSync(
    'UPDATE words SET isFavorite = ?, updatedAt = ? WHERE id = ?',
    [isFavorite ? 1 : 0, now(), id]
  );
}

export function setMemorized(id: number, isMemorized: boolean): void {
  db.runSync(
    'UPDATE words SET isMemorized = ?, updatedAt = ? WHERE id = ?',
    [isMemorized ? 1 : 0, now(), id]
  );
}

// ─── Study Logs ──────────────────────────────────────────────────────────────

export function addStudyLog(wordId: number, mode: string, result: string): void {
  db.runSync(
    'INSERT INTO study_logs (wordId, mode, result, studiedAt) VALUES (?, ?, ?, ?)',
    [wordId, mode, result, now()]
  );
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export function getStats(): Stats {
  const totalRow = db.getFirstSync<{ total: number }>('SELECT COUNT(*) as total FROM words');
  const favoriteRow = db.getFirstSync<{ favorite: number }>('SELECT COUNT(*) as favorite FROM words WHERE isFavorite = 1');
  const todayRow = db.getFirstSync<{ todayCount: number }>(
    "SELECT COUNT(*) as todayCount FROM study_logs WHERE date(studiedAt) = date('now', 'localtime')"
  );
  const accuracyRow = db.getFirstSync<{ correct: number; total: number }>(
    "SELECT SUM(CASE WHEN result = 'CORRECT' THEN 1 ELSE 0 END) as correct, COUNT(*) as total FROM study_logs"
  );

  const studyDates = db.getAllSync<{ studyDate: string }>(
    "SELECT DISTINCT date(studiedAt, 'localtime') as studyDate FROM study_logs ORDER BY studyDate DESC LIMIT 60"
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < studyDates.length; i++) {
    const d = new Date(studyDates[i].studyDate);
    d.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    if (d.getTime() === expected.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  const accuracy =
    accuracyRow && accuracyRow.total > 0
      ? Math.round((accuracyRow.correct / accuracyRow.total) * 100)
      : 0;

  const wordbookRows = db.getAllSync<any>(`
    SELECT wb.id, wb.name, COUNT(w.id) as wordCount
    FROM wordbooks wb
    LEFT JOIN words w ON w.wordbookId = wb.id
    GROUP BY wb.id
    ORDER BY wb.createdAt DESC
  `);

  return {
    words: {
      total: totalRow?.total ?? 0,
      favorite: favoriteRow?.favorite ?? 0,
    },
    study: {
      todayCount: todayRow?.todayCount ?? 0,
      accuracy,
      streak,
    },
    wordbooks: wordbookRows.map((r) => ({ id: r.id, name: r.name, wordCount: r.wordCount ?? 0 })),
  };
}
