import path from "path";
import fs from "fs";
import { promisify } from "util";
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

  /**
   * Lấy tất cả tài liệu của một môn học, nhóm theo chương
   * 
   * @param subjectId - ID của môn học
   * @returns Array gồm các chapter với resources bên trong, sắp xếp theo sortOrder
   */
  async listBySubject(subjectId: string) {
    // Lấy tất cả chapter của subject
    const chapters = await prisma.chapter.findMany({
      where: { subjectId },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        sortOrder: true,
      },
    });

    // Lấy tất cả taskman của subject thông qua chapters
    const taskmen = await prisma.taskman.findMany({
      where: {
        chapter: {
          subjectId,
        },
      },
      select: {
        id: true,
        chapterId: true,
        title: true,
        url: true,
        fileType: true,
        isVisible: true,
        sortOrder: true,
      },
      orderBy: [
        { chapter: { sortOrder: "asc" } },
        { sortOrder: "asc" },
      ],
    });

    // Nhóm taskmen theo chapterId
    const result = chapters.map((chapter) => ({
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      sortOrder: chapter.sortOrder,
      resources: taskmen.filter((t) => t.chapterId === chapter.id),
    }));

    return result;
  }

  /**
   * Cập nhật sortOrder hàng loạt cho nhiều Taskman
   * Sử dụng Prisma transaction để đảm bảo tính nhất quán
   * 
   * @param items - Array các object { id, sortOrder }
   */
  async reorder(items: { id: string; sortOrder: number }[]) {
    if (!items || items.length === 0) {
      throw new Error("Danh sách không được trống");
    }

    // Dùng transaction để update tất cả cùng lúc
    const updates = items.map((item) =>
      prisma.taskman.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    );

    await prisma.$transaction(updates);

    return { success: true };
  }

  /**
   * Xóa Taskman và xóa file vật lý nếu file được lưu trữ locally
   * 
   * @param id - ID của Taskman
   */
  async deleteWithFile(id: string) {
    // Lấy thông tin taskman trước khi xóa
    const taskman = await prisma.taskman.findUnique({
      where: { id },
      select: { url: true },
    });

    if (!taskman) {
      throw new Error("Không tìm thấy tài liệu");
    }

    // Kiểm tra nếu url là path local (bắt đầu với "uploads/")
    if (taskman.url && taskman.url.startsWith("uploads/")) {
      try {
        const unlinkAsync = promisify(fs.unlink);
        await unlinkAsync(taskman.url);
      } catch (err: any) {
        // Log lỗi nhưng không throw, để vẫn xóa được record trong DB
        console.warn(`⚠️ Không thể xóa file ${taskman.url}:`, err.message);
      }
    }

    // Xóa record trong database
    await prisma.taskman.delete({
      where: { id },
    });

    return { deleted: true };
  }
}