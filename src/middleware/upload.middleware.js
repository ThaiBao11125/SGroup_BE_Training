// src/middleware/upload.middleware.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { BadRequestError } from '../core/error.response.js';

// 1. Định nghĩa thư mục lưu trữ cục bộ
const UPLOAD_DIRECTORY = path.join(process.cwd(), 'uploads');

// Tự động kiểm tra và tạo thư mục 'uploads' nếu chưa tồn tại
if (!fs.existsSync(UPLOAD_DIRECTORY)) {
  fs.mkdirSync(UPLOAD_DIRECTORY, { recursive: true });
}

// 2. Cấu hình Disk Storage
const storage = multer.diskStorage({
  // Nơi lưu trữ file
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIRECTORY);
  },

  // Quy tắc đặt tên file: fieldname-timestamp-random.extension
  filename: (req, file, cb) => {
    // Lấy phần đuôi mở rộng an toàn (.png, .jpg,...)
    const ext = path.extname(file.originalname).toLowerCase();

    // Sinh chuỗi ngẫu nhiên để đảm bảo không bao giờ trùng tên
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    // Tên file mới hoàn chỉnh
    const sanitizedFilename = `${file.fieldname}-${uniqueSuffix}${ext}`;

    cb(null, sanitizedFilename);
  }
});

// 3. Bộ lọc kiểm tra định dạng file (File Filter)
const imageFileFilter = (req, file, cb) => {
  // Danh sách các MIME Type cho phép
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Cho phép tải lên
  } else {
    // Trả về BadRequestError chuẩn hóa kế thừa từ ApiError
    cb(new BadRequestError('Định dạng file không hợp lệ! Chỉ chấp nhận ảnh (jpeg, jpg, png, webp, gif).'), false);
  }
};

// 4. Khởi tạo instance Multer gốc với các giới hạn an toàn
export const multerUpload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // Giới hạn kích thước file: 2 Megabytes (2MB)
  },
  fileFilter: imageFileFilter
});

/**
 * 5. Middleware Wrapper xử lý upload 1 file đơn lẻ
 * Tự động chuyển đổi toàn bộ MulterError thành BadRequestError
 */
export const uploadSingleImage = (fieldName = 'file', required = true) => {
  return (req, res, next) => {
    const upload = multerUpload.single(fieldName);

    upload(req, res, (err) => {
      // Bắt lỗi chuyên biệt từ Multer
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new BadRequestError('Kích thước file vượt quá giới hạn cho phép (Tối đa 2MB)!'));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new BadRequestError(`Field name không đúng quy định! Vui lòng đặt tên key là '${fieldName}'.`));
        }
        return next(new BadRequestError(`Lỗi upload file: ${err.message}`));
      }

      // Bắt lỗi từ fileFilter (BadRequestError) hoặc lỗi khác
      if (err) {
        return next(err);
      }

      // Kiểm tra file bắt buộc
      if (required && !req.file) {
        return next(new BadRequestError(`Vui lòng chọn một file để tải lên (key: '${fieldName}')!`));
      }

      next();
    });
  };
}