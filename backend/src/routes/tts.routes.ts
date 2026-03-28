import { Router } from 'express';
import { tts } from '../controllers/tts.controller';

const router = Router();

router.post('/', tts);

export default router;
