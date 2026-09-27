// src/service/upload.service.js
import fs from 'fs';
import path from 'path';

export const formatUploadedFile = (file, req) => {
  if (!file) return null;
  const relativeUrl = `/uploads/${file.filename}`;

  return {
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    url: relativeUrl,
    path: relativeUrl,
  };
};

export const deleteUploadedFile = (fileUrlOrPath) => {
  if (!fileUrlOrPath) return false;
  const sanitizedPath = fileUrlOrPath.replace(/^\/+/, '');
  const absolutePath = path.join(process.cwd(), sanitizedPath);

  if (fs.existsSync(absolutePath)) {
    try {
      fs.unlinkSync(absolutePath);
      return true;
    } catch (error) {
      console.error(`[UploadService] Lỗi xóa file: ${absolutePath}`, error.message);
      return false;
    }
  }
  return false;
};