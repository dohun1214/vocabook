import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as wordService from '../services/word.service';

const wordSchema = z.object({
  word: z.string().min(1),
  meaning: z.string().min(1),
  example: z.string().optional(),
});

const wordUpdateSchema = z.object({
  word: z.string().min(1).optional(),
  meaning: z.string().min(1).optional(),
  example: z.string().optional(),
});

export async function getWords(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const wordbookId = parseInt(req.params.wordbookId);
    const { search, isFavorite, sortBy, order } = req.query;

    const words = await wordService.getWords(wordbookId, req.user!.id, {
      search: search as string | undefined,
      isFavorite: isFavorite !== undefined ? isFavorite === 'true' : undefined,
      sortBy: sortBy as 'word' | 'createdAt' | 'nextReviewAt' | undefined,
      order: order as 'asc' | 'desc' | undefined,
    });
    res.json({ words });
  } catch (err) {
    next(err);
  }
}

export async function createWord(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = wordSchema.parse(req.body);
    const wordbookId = parseInt(req.params.wordbookId);
    const word = await wordService.createWord(wordbookId, req.user!.id, body);
    res.status(201).json({ word });
  } catch (err) {
    next(err);
  }
}

export async function createWords(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { words } = z.object({ words: z.array(wordSchema).min(1) }).parse(req.body);
    const wordbookId = parseInt(req.params.wordbookId);
    const result = await wordService.createWords(wordbookId, req.user!.id, words);
    res.status(201).json({ count: result.count });
  } catch (err) {
    next(err);
  }
}

export async function updateWord(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const body = wordUpdateSchema.parse(req.body);
    const word = await wordService.updateWord(id, req.user!.id, body);
    res.json({ word });
  } catch (err) {
    next(err);
  }
}

export async function deleteWord(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    await wordService.deleteWord(id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function patchFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const { isFavorite } = z.object({ isFavorite: z.boolean() }).parse(req.body);
    const word = await wordService.patchFavorite(id, req.user!.id, isFavorite);
    res.json({ word });
  } catch (err) {
    next(err);
  }
}

