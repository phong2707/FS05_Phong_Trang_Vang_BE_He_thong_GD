import path from "path";
import models from "@models";
import { ApplicationService } from "./application.service";

// ✅ Sử dụng typeof models để tránh lỗi prisma
type PrismaClientType = typeof models;
const prisma = models as PrismaClientType;

/* ✅ FILE TYPE DEFINITION */
type TaskmanFileType =
  | "LINK"
  | "WORD"
  | "EXCEL"
  | "POWERPOINT"
  | "PDF"
  | "IMAGE"
  | "VIDEO"
  | "ZIP"
  | "OTHER";

/* ✅ DETECT FILE TYPE (ĐẶT TRONG SERVICE) */
function detectFileType(
  mimetype: string,
  originalName: string
): TaskmanFileType {
  const ext = path.extname(originalName).toLowerCase();

  if (mimetype.startsWith("image/")) return "IMAGE";
  if (mimetype.startsWith("video/")) return "VIDEO";

  if (mimetype === "application/pdf") return "PDF";

  if (
    mimetype === "application/msword" ||
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "WORD";
  }

  if (
    mimetype === "application/vnd.ms-excel" ||
    mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "EXCEL";
  }

  if (
    mimetype === "application/vnd.ms-powerpoint" ||
    mimetype ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return "POWERPOINT";
  }

  if ([".zip", ".rar"].includes(ext)) return "ZIP";

  return "OTHER";
}

export class TaskmanService extends ApplicationService {
  /* ✅ LINK */
  async createLink(subjectId: string, title: string, url: string) {
    return prisma.taskman.create({
      data: {
        subjectId,
        title,
        fileType: "LINK",
        url,
      },
    });
  }

  /* ✅ FILE – AUTO FILE TYPE */
  async createFile(
    subjectId: string,
    title: string,
    fileUrl: string,
    mimetype: string,
    originalName: string
  ) {
    const fileType = detectFileType(mimetype, originalName);

    return prisma.taskman.create({
      data: {
        subjectId,
        title,
        fileType,
        url: fileUrl,
      },
    });
  }

  async listBySubject(subjectId: string) {
    return prisma.taskman.findMany({
      where: { subjectId },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: string, data: { title?: string; url?: string }) {
    return prisma.taskman.update({
      where: { id },
      data,
    });
  }

  async toggleVisibility(id: string, isVisible: boolean) {
    return prisma.taskman.update({
      where: { id },
      data: { isVisible },
    });
  }

  async delete(id: string) {
    await prisma.taskman.delete({
      where: { id },
    });
    return { deleted: true };
  }
}