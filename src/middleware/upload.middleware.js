import multer from 'multer';
import path from 'path';
import { BadRequestError } from '../core/error.response.js';

const storage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Định dạng không hợp lệ! Chỉ chấp nhận file ảnh (jpeg, jpg, png, webp, gif).'), false);
  }
};

const documentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'image/jpeg',
    'image/png'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`File "${file.originalname}" không được hỗ trợ! Chỉ chấp nhận tài liệu (pdf, doc, docx, xlsx, txt, zip, png, jpg).`), false);
  }
};

const imageUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

const documentUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: documentFileFilter,
});

export const uploadSingleImage = (fieldName = 'file') => {
  return (req, res, next) => {
    const upload = imageUpload.single(fieldName);

    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new BadRequestError('Kích thước ảnh vượt quá giới hạn 2MB!'));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new BadRequestError(`Field name không đúng quy định! Vui lòng đặt key là '${fieldName}'.`));
        }
        return next(new BadRequestError(`Lỗi upload ảnh: ${err.message}`));
      }

      if (err) return next(err);

      if (!req.file) {
        return next(new BadRequestError(`Vui lòng chọn một file ảnh để tải lên (key: '${fieldName}')!`));
      }

      next();
    });
  };
};

export const uploadMultipleDocuments = (fieldName = 'documents', maxCount = 5) => {
  return (req, res, next) => {
    const upload = documentUpload.array(fieldName, maxCount);

    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new BadRequestError('Có file vượt quá kích thước cho phép (Tối đa 10MB/file)!'));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new BadRequestError(`Vượt quá số lượng file cho phép! Tối đa là ${maxCount} file cùng lúc.`));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new BadRequestError(`Field name không đúng! Vui lòng đặt tên key là '${fieldName}'.`));
        }
        return next(new BadRequestError(`Lỗi upload tài liệu: ${err.message}`));
      }

      if (err) return next(err);

      if (!req.files || req.files.length === 0) {
        return next(new BadRequestError(`Vui lòng chọn ít nhất một file tài liệu (key: '${fieldName}')!`));
      }

      next();
    });
  };
};