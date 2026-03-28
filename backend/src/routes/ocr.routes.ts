import { Router } from 'express';
import { parse } from '../controllers/ocr.controller';

const router = Router();

router.post('/parse', parse);

export default router;
