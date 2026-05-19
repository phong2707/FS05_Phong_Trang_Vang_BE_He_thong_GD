
import models from "@models";

/**
 * Giáo viên xem danh sách môn học được phân công
 */
export async function getTeacherSubjects(teacherId: string) {
  return models.subject.findMany({
    where: {
      // ✅ FIX: Lọc qua bảng trung gian SubjectTeacher
      teachers: {
        some: {
          teacherId: teacherId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      sortOrder: true,
      createdAt: true,
      course: {
        select: {
          id: true,
          title: true,
          price: true,
          status: true,
        },
      },
    },
    orderBy: {
      sortOrder: "asc",
    },
  });
}

/**
 * Xem chi tiết một môn học (Đã comment theo code cũ của bạn)
 */
// export async function getSubjectDetail(subjectId: string) {
// ...
// }

/**
 * ✅ Giáo viên xem chi tiết MỘT MÔN HỌC (CHỈ MÔN CỦA MÌNH)
 */

/**
 * ✅ Giáo viên xem chi tiết môn học (FULL LMS STRUCTURE)
 */
export async function getSubjectDetailByTeacher(
  subjectId: string,
  teacherId: string
) {
  return models.subject.findFirst({
    where: {
      id: subjectId,
      teachers: {
        some: {
          teacherId,
        },
      },
    },

    include: {
      // ✅ Course info
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          status: true,
        },
      },

      // ✅ Class groups
      classGroups: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },

      // ✅ ✅ CHUẨN KIẾN TRÚC MỚI
      chapters: {
        orderBy: {
          sortOrder: "asc",
        },

        include: {
          // ✅ Videos thuộc Chapter
          videos: {
            orderBy: {
              sortOrder: "asc",
            },
          },

          // ✅ Taskman thuộc Chapter
          taskmen: {
            where: {
              isVisible: true,
            },
            orderBy: {
              sortOrder: "asc",
            },
          },

          // ✅ Tests thuộc Chapter
          tests: {
            orderBy: {
              createdAt: "desc",
            },

            // (optional nhưng nên có)
            include: {
              testQuestions: {
                include: {
                  question: {
                    select: {
                      id: true,
                      content: true,
                      questionFormat: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}
