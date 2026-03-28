import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { parseTextToWords } from '../services/ocr.service';

export async function parse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text } = z.object({ text: z.string().min(1).max(10000) }).parse(req.body);
    const words = await parseTextToWords(text);
    res.json({ words });
  } catch (err) {
    next(err);
  }
}
