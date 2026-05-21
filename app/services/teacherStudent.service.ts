import models from "@models";

type PrismaClientType = typeof models;
const prisma = models as PrismaClientType;

// Service xử lý lấy danh sách sinh viên cho giáo viên theo môn / theo lớp

/**
 * Kiểm tra giáo viên có được phân công môn hay không
 * Nếu có trả về subject (id, name), nếu không trả về null
 */
async function assertTeacherOwnsSubject(teacherId: string, subjectId: string) {
  const subject = await prisma.subject.findFirst({
    where: {
      id: subjectId,
      teachers: { some: { teacherId } },
    },
    select: { id: true, name: true },
  });

  if (!subject) return null;
  return subject;
}

/**
 * Lấy danh sách sinh viên theo môn (tất cả lớp thuộc môn đó)
 */
export async function getStudentsBySubject(teacherId: string, subjectId: string) {
  const subject = await assertTeacherOwnsSubject(teacherId, subjectId);
  if (!subject) return null;

  const classGroups = await prisma.classGroup.findMany({
    where: { subjectId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      status: true,
      groupUsers: {
        where: { role: "STUDENT" },
        orderBy: { joinedAt: "asc" },
        select: {
          joinedAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              middleName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              phoneNumber: true,
              status: true,
            },
          },
        },
      },
    },
  });

  const mappedGroups = classGroups.map((g) => {
    const students = g.groupUsers.map((gu) => {
      const u = gu.user;
      const fullName = [u.firstName, u.middleName, u.lastName].filter(Boolean).join(" ").trim();
      return {
        userId: u.id,
        studentCode: (u as any).studentCode ?? u.id.slice(0, 8),
        fullName: fullName || null,
        email: u.email,
        avatarUrl: u.avatarUrl ?? null,
        phoneNumber: u.phoneNumber ?? null,
        status: u.status,
        joinedAt: gu.joinedAt.toISOString(),
      };
    });

    return {
      classGroupId: g.id,
      classGroupName: g.name,
      status: g.status,
      studentCount: students.length,
      students,
    };
  });

  const totalStudents = mappedGroups.reduce((acc, g) => acc + g.studentCount, 0);

  return {
    subjectId: subject.id,
    subjectName: subject.name,
    totalStudents,
    classGroups: mappedGroups,
  };
}

/**
 * Lấy danh sách sinh viên trong một classGroup cụ thể thuộc subject
 */
export async function getStudentsByClassGroup(
  teacherId: string,
  subjectId: string,
  classGroupId: string
) {
  const subject = await assertTeacherOwnsSubject(teacherId, subjectId);
  if (!subject) return null;

  const classGroup = await prisma.classGroup.findFirst({
    where: { id: classGroupId, subjectId },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });

  if (!classGroup) return null; // class group không thuộc subject

  const groupUsers = await prisma.classGroupUser.findMany({
    where: { classGroupId: classGroup.id, role: "STUDENT" },
    orderBy: { joinedAt: "asc" },
    select: {
      joinedAt: true,
      user: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          phoneNumber: true,
          status: true,
        },
      },
    },
  });

  const students = groupUsers.map((gu) => {
    const u = gu.user;
    const fullName = [u.firstName, u.middleName, u.lastName].filter(Boolean).join(" ").trim();
    return {
      userId: u.id,
      studentCode: (u as any).studentCode ?? u.id.slice(0, 8),
      fullName: fullName || null,
      email: u.email,
      avatarUrl: u.avatarUrl ?? null,
      phoneNumber: u.phoneNumber ?? null,
      status: u.status,
      joinedAt: gu.joinedAt.toISOString(),
    };
  });

  return students;
}

export default {
  getStudentsBySubject,
  getStudentsByClassGroup,
};
