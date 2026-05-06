import type { PrismaClient as PrismaClientType } from "@prisma/client";
import models from "@models";

// ✅ ép kiểu cho TypeScript
const prisma = models as unknown as PrismaClientType;

export class ClassGroupUserService {
  // async enrollStudent(classGroupId: string, studentId: string) {
  //   const student = await prisma.user.findUnique({
  //     where: { id: studentId },
  //   });

  //   if (!student) {
  //     throw new Error("Sinh viên không tồn tại");
  //   }

  //   const existed = await prisma.classGroupUser.findUnique({
  //     where: {
  //       userId_classGroupId: {
  //         userId: studentId,
  //         classGroupId,
  //       },
  //     },
  //   });

  //   if (existed) {
  //     throw new Error("Sinh viên đã được ghi danh vào lớp");
  //   }

  //   return prisma.classGroupUser.create({
  //     data: {
  //       userId: studentId,
  //       classGroupId,
  //       role: "STUDENT",
  //     },
  //   });
  // }

  async enrollStudent(classGroupId: string, email: string) {
  // 1️⃣ Tìm user theo email
  const student = await prisma.user.findUnique({
    where: { email },
  });

  if (!student) {
    throw new Error("Không tìm thấy sinh viên với email này");
  }

  // 2️⃣ Kiểm tra đã ghi danh chưa
  const existed = await prisma.classGroupUser.findUnique({
    where: {
      userId_classGroupId: {
        userId: student.id,
        classGroupId,
      },
    },
  });

  if (existed) {
    throw new Error("Sinh viên đã được ghi danh vào lớp");
  }

  // 3️⃣ Ghi danh
  return prisma.classGroupUser.create({
    data: {
      userId: student.id,
      classGroupId,
      role: "STUDENT",
    },
  });
}

  async getStudents(classGroupId: string) {
    return prisma.classGroupUser.findMany({
      where: { classGroupId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async removeStudent(classGroupId: string, studentId: string) {
  const existed = await prisma.classGroupUser.findUnique({
    where: {
      userId_classGroupId: {
        userId: studentId,
        classGroupId,
      },
    },
  });

  if (!existed) {
    // ✅ Lần 2 trở đi: không coi là lỗi
    return {
      deleted: false,
      message: "Sinh viên đã được xóa hoặc không tồn tại trong lớp",
    };
  }

  await prisma.classGroupUser.delete({
    where: {
      userId_classGroupId: {
        userId: studentId,
        classGroupId,
      },
    },
  });

  return {
    deleted: true,
    message: "Đã xóa sinh viên khỏi lớp",
  };
}

}
