import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { BadRequestError } from '../core/error.response.js';

const UPLOAD_DIRECTORY = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIRECTORY)) {
  fs.mkdirSync(UPLOAD_DIRECTORY, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIRECTORY);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    const sanitizedFilename = `${file.fieldname}-${uniqueSuffix}${ext}`;

    cb(null, sanitizedFilename);
  }
});

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
    cb(new BadRequestError('Định dạng file không hợp lệ! Chỉ chấp nhận ảnh (jpeg, jpg, png, webp, gif).'), false);
  }
};

export const multerUpload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: imageFileFilter
});

export const uploadSingleImage = (fieldName = 'file', required = true) => {
  return (req, res, next) => {
    const upload = multerUpload.single(fieldName);

    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new BadRequestError('Kích thước file vượt quá giới hạn cho phép (Tối đa 2MB)!'));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new BadRequestError(`Field name không đúng quy định! Vui lòng đặt tên key là '${fieldName}'.`));
        }
        return next(new BadRequestError(`Lỗi upload file: ${err.message}`));
      }

      if (err) {
        return next(err);
      }

      if (required && !req.file) {
        return next(new BadRequestError(`Vui lòng chọn một file để tải lên (key: '${fieldName}')!`));
      }

      next();
    });
  };
}