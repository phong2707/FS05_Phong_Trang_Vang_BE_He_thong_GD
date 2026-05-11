import models from "@models";

/**
 * ✅ Giáo viên xem danh sách MÔN HỌC được phân công
 */
export async function getTeacherSubjects(teacherId: string) {
  return models.subject.findMany({
    where: {
      teacherId, // ✅ CHỐT: phân công theo MÔN HỌC
    },
    select: {
      id: true,
      name: true,
      description: true,
      sortOrder: true,
      createdAt: true,

      // ✅ Lấy thông tin khóa học để hiển thị (KHÔNG phân quyền theo course)
      course: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      sortOrder: "asc",
    },
  });
}

/**
 * ✅ Giáo viên xem chi tiết MỘT MÔN HỌC
 */
export async function getSubjectDetail(subjectId: string, teacherId: string) {
  return models.subject.findFirst({
    where: {
      id: subjectId,
      teacherId, // ✅ QUAN TRỌNG: chỉ xem được môn của chính mình
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          description: true,
        },
      },

      classGroups: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },

      videos: {
        select: {
          id: true,
          title: true,
          durationSeconds: true,
        },
        orderBy: { sortOrder: "asc" },
      },

      taskmen: {
        select: {
          id: true,
          title: true,
          url: true,
          fileType: true,
        },
        orderBy: { sortOrder: "asc" },
      },

      tests: {
        select: {
          id: true,
          title: true,
          testType: true,
          durationMinutes: true,
        },
      },
    },
  });
}
