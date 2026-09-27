import { Router } from 'express';
import * as uploadController from '../controller/upload.controller.js';
import { uploadSingleImage, uploadMultipleDocuments } from '../middleware/upload.middleware.js';

const router = Router();

router.post('/image', uploadSingleImage('image'), uploadController.uploadSingleImage);

router.post('/documents', uploadMultipleDocuments('documents', 5), uploadController.uploadMultipleDocuments);

export default router;