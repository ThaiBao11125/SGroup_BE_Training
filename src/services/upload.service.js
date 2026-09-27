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