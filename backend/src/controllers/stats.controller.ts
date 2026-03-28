import { Request, Response, NextFunction } from 'express';
import { getStats } from '../services/stats.service';

export async function stats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await getStats(req.user!.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
