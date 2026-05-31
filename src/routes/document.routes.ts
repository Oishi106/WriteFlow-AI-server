import { Router } from 'express';
import {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} from '../controllers/document.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, createDocument);
router.get('/', authenticate, getDocuments);
router.get('/:id', authenticate, getDocumentById);
router.patch('/:id', authenticate, updateDocument);
router.delete('/:id', authenticate, deleteDocument);

export default router;
