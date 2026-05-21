import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { Request } from "express";

// 1. Cấu hình thư mục lưu trữ
const uploadDir = path.join(__dirname, "../../../uploads"); // Trỏ ra thư mục uploads ở gốc backend

// Đảm bảo thư mục tồn tại, nếu chưa có thì tạo mới ngay khi khởi động
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Danh sách định dạng file cho phép (Whitelist)
const ALLOWED_MIMETYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "image/jpeg",
  "image/png",
  "image/gif",
  "video/mp4",
  "application/zip",
  "application/x-rar-compressed"
];

// 3. Cấu hình Storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Đặt tên file ngẫu nhiên để tránh trùng lặp
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

// 4. File Filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Trả về lỗi nếu file không hợp lệ
    cb(new Error(`Định dạng file ${file.mimetype} không được hỗ trợ!`));
  }
};

// 5. Khởi tạo middleware
export const uploadTaskmanFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Giới hạn 10MB
  },
});