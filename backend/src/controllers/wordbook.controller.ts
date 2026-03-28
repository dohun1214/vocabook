import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as wordbookService from '../services/wordbook.service';

const nameSchema = z.object({ name: z.string().min(1).max(100) });

export async function getWordbooks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const wordbooks = await wordbookService.getWordbooks(req.user!.id);
    res.json({ wordbooks });
  } catch (err) {
    next(err);
  }
}

export async function createWordbook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name } = nameSchema.parse(req.body);
    const wordbook = await wordbookService.createWordbook(req.user!.id, name);
    res.status(201).json({ wordbook });
  } catch (err) {
    next(err);
  }
}

export async function updateWordbook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const { name } = nameSchema.parse(req.body);
    const wordbook = await wordbookService.updateWordbook(id, req.user!.id, name);
    res.json({ wordbook });
  } catch (err) {
    next(err);
  }
}

export async function deleteWordbook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    await wordbookService.deleteWordbook(id, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
