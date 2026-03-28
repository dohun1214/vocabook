import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { synthesize } from '../services/tts.service';

export async function tts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text, languageCode } = z
      .object({
        text: z.string().min(1).max(500),
        languageCode: z.string().optional().default('en-US'),
      })
      .parse(req.body);

    const audio = await synthesize(text, languageCode);
    res.json({ audio, format: 'mp3' });
  } catch (err) {
    next(err);
  }
}
