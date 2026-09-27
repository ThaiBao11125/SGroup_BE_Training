# HƯỚNG DẪN TÍCH HỢP CLOUDFLARE R2 & MULTIPLE UPLOAD (TỐI ĐA 5 FILE)

---

## MỤC LỤC
1. [Tổng Quan Kiến Trúc Mới](#1-tổng-quan-kiến-trúc-mới)
2. [Đăng Ký & Lấy Thông Tin Cấu Hình Cloudflare R2](#2-đăng-ký--lấy-thông-tin-cấu-hình-cloudflare-r2)
3. [Cài Đặt Thư Viện Cần Thiết](#3-cài-đặt-thư-viện-cần-thiết)
4. [Thiết Kế Cơ Sở Dữ Liệu (PostgreSQL)](#4-thiết-kế-cơ-sở-dữ-liệu-postgresql)
5. [Hướng Dẫn Triển Khai Chi Tiết Từng File](#5-hướng-dẫn-triển-khai-chi-tiết-từng-file)
   - [5.1. Cấu hình biến môi trường (`.env` & `env.config.js`)](#51-cấu-hình-biến-môi-trường-env--envconfigjs)
   - [5.2. Khởi tạo Cloudflare R2 Client (`src/config/r2.config.js`)](#52-khởi-tạo-cloudflare-r2-client-srcconfigr2configjs)
   - [5.3. Tạo File Repository (`src/repository/file.repository.js`)](#53-tạo-file-repository-srcrepositoryfilerepositoryjs)
   - [5.4. Viết Upload Middleware với Memory Storage (`src/middleware/upload.middleware.js`)](#54-viết-upload-middleware-với-memory-storage-srcmiddlewareuploadmiddlewarejs)
   - [5.5. Viết Upload Service (`src/services/upload.service.js`)](#55-viết-upload-service-srcservicesuploadservicejs)
   - [5.6. Viết Upload Controller (`src/controller/upload.controller.js`)](#56-viết-upload-controller-srccontrolleruploadcontrollerjs)
   - [5.7. Định nghĩa Route Upload (`src/routes/upload.route.js`)](#57-định-nghĩa-route-upload-srcroutesuploadroutejs)
   - [5.8. Đăng ký Route vào hệ thống (`src/routes/index.js`)](#58-đăng-ký-route-vào-hệ-thống-srcroutesindexjs)
6. [Hướng Dẫn Test Bằng Apidog](#6-hướng-dẫn-test-bằng-apidog)

---

## 1. TỔNG QUAN KIẾN TRÚC MỚI

### So sánh kiến trúc:
- **Hiện tại (Local Disk Storage):**
  Client gửi file $\rightarrow$ `Multer` lưu file vào thư mục vật lý `uploads/` trên máy tính $\rightarrow$ Trả về relative URL (`/uploads/...`).
  *Nhược điểm:* Khi deploy server lên các nền tảng container (Docker, Heroku, Render, AWS ECS, serverless), ổ cứng là ephemeral (tạm thời) nên khi restart server là mất sạch file; không thể scale nhiều instance.
- **Mục tiêu mới (Cloudflare R2 + PostgreSQL):**
  Client gửi file $\rightarrow$ `Multer` nhận file tạm vào bộ nhớ RAM (`memoryStorage` dạng Buffer) $\rightarrow$ `AWS S3 SDK` upload file trực tiếp lên **Cloudflare R2** $\rightarrow$ Nhận về HTTPS URL công khai $\rightarrow$ Lưu thông tin file cùng HTTPS URL vào **PostgreSQL** $\rightarrow$ Trả về kết quả cho client.

### Vì sao chọn Cloudflare R2?
- **Miễn phí 10GB lưu trữ / tháng**.
- **0đ chi phí băng thông (Zero Egress Fees)**: Khác với AWS S3 bị tính phí khi người dùng tải ảnh/file về, Cloudflare R2 hoàn toàn miễn phí băng thông chiều ra.
- **Tương thích 100% chuẩn S3 API**: Dùng trực tiếp bộ thư viện `@aws-sdk/client-s3`.

---

## 2. ĐĂNG KÝ & LẤY THÔNG TIN CẤU HÌNH CLOUDFLARE R2

### Bước 2.1: Đăng ký tài khoản Cloudflare
1. Truy cập [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) và tạo tài khoản.
2. Xác nhận email từ Cloudflare.

### Bước 2.2: Tạo R2 Bucket
1. Tại menu bên trái của Cloudflare Dashboard, chọn **R2** (hoặc **Storage & Databases** > **R2**).
2. Nhấn nút **Create bucket**.
3. Đặt tên Bucket (ví dụ: `sgroup-storage-training`).
4. Chọn vùng vị trí (Location): chọn **Automatic** (hoặc chọn khu vực APAC).
5. Nhấn **Create Bucket**.

### Bước 2.3: Bật quyền truy cập công khai (Public Access) để lấy HTTPS URL
Mặc định bucket là private, cần bật public URL để có link HTTPS xem ảnh/tài liệu:
1. Vào bên trong Bucket vừa tạo > chuyển sang tab **Settings**.
2. Tìm đến mục **Public Access**.
3. Bạn có 2 lựa chọn:
   - **Cách 1 (Nhanh nhất - Không cần domain riêng):**
     Tại mục **R2.dev subdomain**, bấm **Allow Access** (nhập chữ `allow` để xác nhận).
     Bạn sẽ nhận được một đường dẫn có dạng:
     `https://pub-xxxxxxxxxxxxxxxxxxxxxxxx.r2.dev`
   - **Cách 2 (Chuyên nghiệp):**
     Nếu có tên miền quản lý trên Cloudflare, bấm **Connect Domain** (ví dụ: `cdn.yourdomain.com`).
4. Lưu lại đường dẫn Public URL này để cấu hình biến `R2_PUBLIC_URL`.

### Bước 2.4: Tạo API Token (Credentials để kết nối từ Node.js)
1. Quay lại trang tổng quan của **R2** (`https://dash.cloudflare.com/?to=/:account/r2`).
2. Ở cột bên phải, bấm vào link **Manage R2 API Tokens**.
3. Nhấn nút **Create API token**.
4. Cấu hình:
   - **Token name:** `backend-upload-token`
   - **Permissions:** Chọn **Object Read & Write**
   - **Apply to specific buckets only:** Chọn bucket vừa tạo ở bước trên (hoặc chọn All buckets).
5. Bấm **Create API Token**.
6. **LƯU NGAY CÁC GIÁ TRỊ SAU RA NOTEPAD** (vì Secret Key chỉ hiển thị 1 lần duy nhất):
   - **Access Key ID**
   - **Secret Access Key**
   - **Endpoint:** Dạng `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` (chuỗi hex trong link chính là `Account ID`).

---

## 3. CÀI ĐẶT THƯ VIỆN CẦN THIẾT

Mở terminal tại thư mục gốc của dự án và chạy lệnh sau để cài AWS S3 SDK Client:

```bash
npm install @aws-sdk/client-s3
```

*(Dự án đã có sẵn `multer` và `pg`).*

---

## 4. THIẾT KẾ CƠ SỞ DỮ LIỆU (POSTGRESQL)

Mở công cụ quản lý database (DBeaver, pgAdmin hoặc terminal `psql`) kết nối vào database `basic_be` và chạy script tạo bảng lưu trữ thông tin file upload:

```sql
CREATE TABLE IF NOT EXISTS uploaded_files (
    id BIGSERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mimetype VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    url VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Nếu bảng users chưa có cột avatar_url, chạy thêm lệnh sau:
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
```

---

## 5. HƯỚNG DẪN TRIỂN KHAI CHI TIẾT TỪNG FILE

### 5.1. Cấu hình biến môi trường (`.env` & `env.config.js`)

#### File `.env`:
Mở file `.env` và thêm vào các thông số vừa lấy được ở Cloudflare:

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=dán_account_id_vào_đây
R2_ACCESS_KEY_ID=dán_access_key_id_vào_đây
R2_SECRET_ACCESS_KEY=dán_secret_access_key_vào_đây
R2_BUCKET_NAME=sgroup-storage-training
R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxxxxx.r2.dev
```

#### File `src/config/env.config.js`:
Cập nhật file `src/config/env.config.js` để nạp các biến cấu hình R2:

```javascript
import dotenv from "dotenv";
dotenv.config();

export const config = {
  app: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
  },
  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "postgres",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "default_jwt_secret_key",
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    publicUrl: process.env.R2_PUBLIC_URL,
  },
};
```

---

### 5.2. Khởi tạo Cloudflare R2 Client (`src/config/r2.config.js`)

Tạo file mới: `src/config/r2.config.js`. File này cấu hình kết nối tới Cloudflare R2 thông qua giao thức S3:

```javascript
import { S3Client } from "@aws-sdk/client-s3";
import { config } from "./env.config.js";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
});

export default r2Client;
```

---

### 5.3. Tạo File Repository (`src/repository/file.repository.js`)

Tạo file mới: `src/repository/file.repository.js`. File này chịu trách nhiệm tương tác trực tiếp với Database để lưu URL HTTPS:

```javascript
import pool from "../config/database.config.js";

export const saveFileInfo = async ({ filename, originalName, mimetype, size, url }) => {
  const queryText = `
    INSERT INTO uploaded_files (filename, original_name, mimetype, size, url)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [filename, originalName, mimetype, size, url];
  const result = await pool.query(queryText, values);
  return result.rows[0];
};

export const saveMultipleFilesInfo = async (filesList) => {
  const savedRecords = [];
  for (const file of filesList) {
    const record = await saveFileInfo(file);
    savedRecords.push(record);
  }
  return savedRecords;
};

export const updateUserAvatar = async (userId, avatarUrl) => {
  const queryText = `
    UPDATE users 
    SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $2 
    RETURNING id, name, email, avatar_url;
  `;
  const result = await pool.query(queryText, [avatarUrl, userId]);
  return result.rows[0];
};
```

---

### 5.4. Viết Upload Middleware với Memory Storage (`src/middleware/upload.middleware.js`)

Cập nhật `src/middleware/upload.middleware.js`.
- Không dùng `diskStorage` (vì không lưu vào ổ cứng local nữa).
- Dùng `multer.memoryStorage()`: File được lưu tạm dưới dạng `Buffer` trong `file.buffer`.
- Tạo 2 middleware:
  1. `uploadSingleImage(fieldName)`: Giới hạn 2MB, chỉ cho phép ảnh.
  2. `uploadMultipleDocuments(fieldName, maxCount = 5)`: Cho phép tối đa 5 file tài liệu (pdf, doc, docx, txt, zip, png, jpg, v.v.), dung lượng mỗi file tối đa 10MB.

```javascript
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
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
```

---

### 5.5. Viết Upload Service (`src/services/upload.service.js`)

Cập nhật `src/services/upload.service.js`. Service này dùng lệnh `PutObjectCommand` để đẩy file lên R2 và gọi repository lưu vào Database:

```javascript
import { PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import r2Client from "../config/r2.config.js";
import { config } from "../config/env.config.js";
import * as fileRepository from "../repository/file.repository.js";

const uploadFileToR2 = async (file, folder = "uploads") => {
  const ext = path.extname(file.originalname).toLowerCase();
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const key = `${folder}/${file.fieldname}-${uniqueSuffix}${ext}`;

  const command = new PutObjectCommand({
    Bucket: config.r2.bucketName,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await r2Client.send(command);

  const cleanPublicUrl = config.r2.publicUrl.replace(/\/+$/, "");
  const publicHttpsUrl = `${cleanPublicUrl}/${key}`;

  return {
    filename: path.basename(key),
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    url: publicHttpsUrl,
  };
};

export const uploadSingleImageService = async (file) => {
  const uploadedData = await uploadFileToR2(file, "images");
  const savedRecord = await fileRepository.saveFileInfo(uploadedData);
  return savedRecord;
};

export const uploadMultipleDocumentsService = async (files) => {
  const uploadPromises = files.map((file) => uploadFileToR2(file, "documents"));
  const uploadedResults = await Promise.all(uploadPromises);

  const savedRecords = await fileRepository.saveMultipleFilesInfo(uploadedResults);
  return savedRecords;
};
```

---

### 5.6. Viết Upload Controller (`src/controller/upload.controller.js`)

Cập nhật `src/controller/upload.controller.js`:

```javascript
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
```

---

### 5.7. Định nghĩa Route Upload (`src/routes/upload.route.js`)

Cập nhật `src/routes/upload.route.js`:

```javascript
import { Router } from 'express';
import * as uploadController from '../controller/upload.controller.js';
import { uploadSingleImage, uploadMultipleDocuments } from '../middleware/upload.middleware.js';

const router = Router();

router.post('/image', uploadSingleImage('image'), uploadController.uploadSingleImage);

router.post('/documents', uploadMultipleDocuments('documents', 5), uploadController.uploadMultipleDocuments);

export default router;
```

---

### 5.8. Đăng ký Route vào hệ thống (`src/routes/index.js`)

Đảm bảo trong `src/routes/index.js` đã gắn `uploadRouter`:

```javascript
import { Router } from 'express';
import userRouter from './users.route.js';
import authRouter from './auth.route.js';
import uploadRouter from './upload.route.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/upload', uploadRouter);

export default router;
```

---

## 6. HƯỚNG DẪN TEST BẰNG APIDOG

### Test Case 1: Upload 1 File Ảnh Lên Cloudflare R2
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/upload/image`
- **Tab Body:**
  - Chọn kiểu: **`form-data`**
  - **Key:** Nhập `image`, chuyển type từ `Text` sang **`File`**.
  - **Value:** Chọn 1 file ảnh (`.jpg`, `.png`, v.v., dung lượng < 2MB).
- **Nhấn Send:**
  - **Mã phản hồi:** `201 Created`
  - **Response Body mẫu:**
    ```json
    {
      "success": true,
      "message": "Upload ảnh lên Cloudflare R2 thành công!",
      "data": {
        "id": "1",
        "filename": "image-1727443200000-987654321.png",
        "original_name": "avatar.png",
        "mimetype": "image/png",
        "size": 245100,
        "url": "https://pub-xxxxxxxx.r2.dev/images/image-1727443200000-987654321.png",
        "created_at": "2026-09-27T13:30:00.000Z"
      }
    }
    ```
  - *Kiểm tra:* Copy đường dẫn `url` dán vào trình duyệt, ảnh sẽ được hiển thị trực tiếp từ CDN Cloudflare R2. Đồng thời kiểm tra bảng `uploaded_files` trong Database sẽ thấy record tương ứng.

---

### Test Case 2: Upload Kèm Tối Đa 5 File Tài Liệu (Multiple Upload)
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/upload/documents`
- **Tab Body:**
  - Chọn kiểu: **`form-data`**
  - Thêm 1 đến 5 dòng có **CÙNG TÊN KEY** là `documents`:
    - Dòng 1: Key = `documents` (chọn kiểu `File`) $\rightarrow$ Chọn file `tai_lieu_1.pdf`
    - Dòng 2: Key = `documents` (chọn kiểu `File`) $\rightarrow$ Chọn file `bao_cao.docx`
    - Dòng 3: Key = `documents` (chọn kiểu `File`) $\rightarrow$ Chọn file `so_lieu.xlsx`
    - Dòng 4: Key = `documents` (chọn kiểu `File`) $\rightarrow$ Chọn file `diagram.png`
    - Dòng 5: Key = `documents` (chọn kiểu `File`) $\rightarrow$ Chọn file `source_code.zip`
- **Nhấn Send:**
  - **Mã phản hồi:** `201 Created`
  - **Response Body mẫu:**
    ```json
    {
      "success": true,
      "message": "Upload thành công 5 file tài liệu lên Cloudflare R2!",
      "data": [
        {
          "id": "2",
          "filename": "documents-1727443210001-111111111.pdf",
          "original_name": "tai_lieu_1.pdf",
          "mimetype": "application/pdf",
          "size": 512000,
          "url": "https://pub-xxxxxxxx.r2.dev/documents/documents-1727443210001-111111111.pdf",
          "created_at": "2026-09-27T13:30:10.000Z"
        },
        {
          "id": "3",
          "filename": "documents-1727443210002-222222222.docx",
          "original_name": "bao_cao.docx",
          "mimetype": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "size": 128000,
          "url": "https://pub-xxxxxxxx.r2.dev/documents/documents-1727443210002-222222222.docx",
          "created_at": "2026-09-27T13:30:10.000Z"
        }
      ]
    }
    ```

---

### Test Case 3: Kiểm Tra Giới Hạn Quá 5 File (Error Validation)
- Thêm 6 dòng với key `documents` và chọn 6 files.
- Bấm **Send**.
- **Mã phản hồi:** `400 Bad Request`
- **Response:**
  ```json
  {
    "success": false,
    "message": "Vượt quá số lượng file cho phép! Tối đa là 5 file cùng lúc."
  }
  ```
