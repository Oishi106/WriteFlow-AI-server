import { Response } from 'express';

interface ApiResponseOptions {
  success: boolean;
  message: string;
  data?: unknown;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  options: ApiResponseOptions & { data?: T }
): Response => {
  return res.status(statusCode).json({
    success: options.success,
    message: options.message,
    ...(options.data !== undefined && { data: options.data }),
    ...(options.meta && { meta: options.meta }),
  });
};

export const successResponse = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
  meta?: ApiResponseOptions['meta']
): Response => {
  return sendResponse<T>(res, statusCode, { success: true, message, data, meta });
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode = 400,
  data?: unknown
): Response => {
  return sendResponse(res, statusCode, { success: false, message, data });
};
