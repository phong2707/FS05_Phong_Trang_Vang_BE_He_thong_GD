import path from "path";
import models from "@models";
import { ApplicationService } from "./application.service";

type PrismaClientType = typeof models;
const prisma = models as PrismaClientType;

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

function detectFileType(mimetype: string, originalName: string): TaskmanFileType {
  const ext = path.extname(originalName).toLowerCase();

  if (mimetype.startsWith("image/")) return "IMAGE";
  if (mimetype.startsWith("video/")) return "VIDEO";
  if (mimetype === "application/pdf") return "PDF";

  if (
    mimetype === "application/msword" ||
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) return "WORD";

  if (
    mimetype === "application/vnd.ms-excel" ||
    mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) return "EXCEL";

  if (
    mimetype === "application/vnd.ms-powerpoint" ||
    mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) return "POWERPOINT";

  if ([".zip", ".rar"].includes(ext)) return "ZIP";

  return "OTHER";
}

export class TaskmanService extends ApplicationService {

  async createLink(chapterId: string, title: string, url: string) {
    return prisma.taskman.create({
  data: {
    title,
    fileType: "LINK",
    url,
    chapter: {
      connect: { id: chapterId }
    }
  }
});
  }

  async createFile(
  chapterId: string,
  title: string,
  fileUrl: string,
  mimetype: string,
  originalName: string
) {
  const fileType = detectFileType(mimetype, originalName);

  return prisma.taskman.create({
    data: {
      title,
      url: fileUrl,
      fileType,
      chapter: {
        connect: { id: chapterId },
      },
    },
  });
}
  async listByChapter(chapterId: string) {
    return prisma.taskman.findMany({
      where: {
        chapterId,
      },
      orderBy: {
        sortOrder: "asc",
      },
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