import { Router } from 'express';
import * as wordController from '../controllers/word.controller';

// mergeParams: true allows access to :wordbookId from parent router
const router = Router({ mergeParams: true });

// Nested routes (under /wordbooks/:wordbookId/words)
router.get('/', wordController.getWords);
router.post('/', wordController.createWord);
router.post('/bulk', wordController.createWords);

// Standalone word routes (under /words/:id)
router.put('/:id', wordController.updateWord);
router.delete('/:id', wordController.deleteWord);
router.patch('/:id/favorite', wordController.patchFavorite);

export default router;
