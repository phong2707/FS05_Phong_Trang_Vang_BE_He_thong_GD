import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";

// ✅ Danh sách đuôi file nguy hiểm (BLACKLIST)
const BLOCKED_EXTENSIONS = [
  ".exe",
  ".sh",
  ".bat",
  ".cmd",
  ".js",
];

// ✅ Storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

// ✅ File filter (KEY POINT)
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // ❌ Chặn file nguy hiểm
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return cb(null, false); // ✅ KHÔNG THROW ERROR
  }

  // ✅ Cho image / video
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/")
  ) {
    return cb(null, true);
  }

  // ✅ Cho các file còn lại
  return cb(null, true);
};
// ✅ Export middleware
export const uploadTaskmanFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});