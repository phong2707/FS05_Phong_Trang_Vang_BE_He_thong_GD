import models from "@models";
import { ApplicationService } from "./application.service";

// ✅ Sử dụng typeof models để tránh lỗi không tìm thấy member trong @prisma/client
type PrismaClientType = typeof models;
const prisma = models as PrismaClientType;

export class TaskmanService extends ApplicationService {
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

  async createFile(
    subjectId: string,
    title: string,
    fileUrl: string,
    fileType: string
  ) {
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