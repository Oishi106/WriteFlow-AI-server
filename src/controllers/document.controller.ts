import { Response } from 'express';
import { DocumentModel } from '../models/document.model';
import { AppError, asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import { AuthRequest } from '../types';

const isOwnerOrAdmin = (userId: string, ownerId: string, role: string): boolean => {
  return role === 'ADMIN' || userId === ownerId;
};

export const createDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, content = '', status } = req.body;

  const document = await DocumentModel.create({
    title,
    content,
    status,
    userId: req.user!._id || req.user!.id,
  });

  return successResponse(res, 'Document created.', document, 201);
});

export const getDocuments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, search, page = '1', limit = '10' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 10);
  const skip = (pageNum - 1) * limitNum;

  const query: Record<string, unknown> = {};
  if (req.user!.role !== 'ADMIN') {
    query.userId = req.user!._id || req.user!.id;
  }
  if (status) {
    query.status = status;
  }
  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  const [documents, total] = await Promise.all([
    DocumentModel.find(query).skip(skip).limit(limitNum).sort({ createdAt: -1 }),
    DocumentModel.countDocuments(query),
  ]);

  return successResponse(res, 'Documents fetched.', documents, 200, {
    page: pageNum,
    limit: limitNum,
    total,
  });
});

export const getDocumentById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const document = await DocumentModel.findById(req.params.id);
  if (!document) throw new AppError('Document not found.', 404);

  const ownerId = document.userId.toString();
  const userId = (req.user!._id || req.user!.id).toString();
  if (!isOwnerOrAdmin(userId, ownerId, req.user!.role)) {
    throw new AppError('Document not found.', 404);
  }

  return successResponse(res, 'Document retrieved.', document);
});

export const updateDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
  const document = await DocumentModel.findById(req.params.id);
  if (!document) throw new AppError('Document not found.', 404);

  const ownerId = document.userId.toString();
  const userId = (req.user!._id || req.user!.id).toString();
  if (!isOwnerOrAdmin(userId, ownerId, req.user!.role)) {
    throw new AppError('Document not found.', 404);
  }

  const updateData: Record<string, unknown> = {};
  if (req.body.title !== undefined) updateData.title = req.body.title;
  if (req.body.content !== undefined) updateData.content = req.body.content;
  if (req.body.status !== undefined) updateData.status = req.body.status;
  if (req.body.wordCount !== undefined) updateData.wordCount = req.body.wordCount;

  const updatedDocument = await DocumentModel.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  return successResponse(res, 'Document updated.', updatedDocument);
});

export const deleteDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
  const document = await DocumentModel.findById(req.params.id);
  if (!document) throw new AppError('Document not found.', 404);

  const ownerId = document.userId.toString();
  const userId = (req.user!._id || req.user!.id).toString();
  if (!isOwnerOrAdmin(userId, ownerId, req.user!.role)) {
    throw new AppError('Document not found.', 404);
  }

  await document.deleteOne();
  return successResponse(res, 'Document deleted.');
});
