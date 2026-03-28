import { Router } from 'express';
import * as wordbookController from '../controllers/wordbook.controller';
import wordRouter from './word.routes';

const router = Router();

router.get('/', wordbookController.getWordbooks);
router.post('/', wordbookController.createWordbook);
router.put('/:id', wordbookController.updateWordbook);
router.delete('/:id', wordbookController.deleteWordbook);

// Nested: /wordbooks/:wordbookId/words
router.use('/:wordbookId/words', wordRouter);

export default router;
