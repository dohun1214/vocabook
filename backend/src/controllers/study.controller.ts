import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as studyService from '../services/study.service';

export async function getToday(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const words = await studyService.getTodayWords(req.user!.id);
    res.json({ words, count: words.length });
  } catch (err) {
    next(err);
  }
}

export async function log(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({
      wordId: z.number().int().positive(),
      mode: z.enum(['FLASHCARD', 'QUIZ_MULTIPLE', 'QUIZ_SHORT']),
      result: z.enum(['CORRECT', 'INCORRECT']),
    });
    const body = schema.parse(req.body);
    const studyLog = await studyService.logStudy(req.user!.id, body.wordId, body.mode, body.result);
    res.status(201).json({ studyLog });
  } catch (err) {
    next(err);
  }
}

export async function review(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const wordId = parseInt(req.params.wordId);
    const { quality } = z.object({ quality: z.number().int().min(0).max(5) }).parse(req.body);
    const word = await studyService.reviewWord(req.user!.id, wordId, quality);
    res.json({ word });
  } catch (err) {
    next(err);
  }
}
