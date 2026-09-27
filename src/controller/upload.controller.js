import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/responseHelper.js';
import * as uploadService from '../services/upload.service.js';

export const uploadSingleImage = catchAsync(async (req, res) => {
  const result = await uploadService.uploadSingleImageService(req.file);
  return sendSuccess(res, 201, 'Upload ảnh lên Cloudflare R2 thành công!', result);
});

export const uploadMultipleDocuments = catchAsync(async (req, res) => {
  const results = await uploadService.uploadMultipleDocumentsService(req.files);
  return sendSuccess(
    res, 
    201, 
    `Upload thành công ${results.length} file tài liệu lên Cloudflare R2!`, 
    results
  );
});