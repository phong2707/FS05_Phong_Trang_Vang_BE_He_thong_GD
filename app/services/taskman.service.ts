import models from "@models";
import type { PrismaClient as PrismaClientType } from "@prisma/client";
import { ApplicationService } from "./application.service";

// ✅ ép kiểu giống ClassGroupUserService
const prisma = models as unknown as PrismaClientType;

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