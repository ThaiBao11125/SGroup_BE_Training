// src/controller/upload.controller.js
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/responseHelper.js';
import * as uploadService from '../services/upload.service.js';

export const uploadSingleFile = catchAsync(async (req, res) => {
  const result = uploadService.formatUploadedFile(req.file, req);
  return sendSuccess(res, 201, 'Upload file thành công', result);
});