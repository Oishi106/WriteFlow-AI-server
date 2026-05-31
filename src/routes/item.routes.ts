import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  createItem,
  deleteItem,
  getItemById,
  getItems,
  updateItem,
} from '../controllers/item.controller';

const router = Router();

router.get('/', getItems);
router.get('/:id', getItemById);
router.post('/', authenticate, authorize('ADMIN'), createItem);
router.patch('/:id', authenticate, authorize('ADMIN'), updateItem);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteItem);

export default router;
