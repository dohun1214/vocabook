import { Router } from 'express';
import * as studyController from '../controllers/study.controller';

const router = Router();

router.get('/today', studyController.getToday);
router.post('/log', studyController.log);
router.post('/review/:wordId', studyController.review);

export default router;
