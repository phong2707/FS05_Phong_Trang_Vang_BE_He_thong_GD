import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";

// nơi lưu file
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

// lọc loại file cho phép
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    // ✅ KHÔNG truyền Error → tránh lỗi TS
    cb(null, false);
  } else {
    cb(null, true);
  }
};

export const uploadTaskmanFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});