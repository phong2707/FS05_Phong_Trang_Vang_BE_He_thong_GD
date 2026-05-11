import models from "@models";

/**
 * Giáo viên xem danh sách môn học được phân công
 */
export async function getTeacherSubjects(teacherId: string) {
  return models.subject.findMany({
    where: {
      teacherId,
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
 * Xem chi tiết một môn học
 */
// export async function getSubjectDetail(subjectId: string) {
//   return models.subject.findUnique({
//     where: { id: subjectId },
//     include: {
//       course: {
//         select: {
//           id: true,
//           title: true,
//           description: true,
//           price: true,
//           status: true,
//         },
//       },
//       classGroups: {
//         select: {
//           id: true,
//           name: true,
//           status: true,
//         },
//       },
//       videos: {
//         select: {
//           id: true,
//           title: true,
//           durationSeconds: true,
//         },
//         orderBy: { sortOrder: "asc" },
//       },
//       taskmen: {
//         select: {
//           id: true,
//           title: true,
//           url: true,
//           fileType: true,
//         },
//         orderBy: { sortOrder: "asc" },
//       },
//       tests: {
//         select: {
//           id: true,
//           title: true,
//           testType: true,
//           durationMinutes: true,
//         },
//       },
//     },
//   });
// }


/**
 * ✅ Giáo viên xem chi tiết MỘT MÔN HỌC (CHỈ MÔN CỦA MÌNH)
 */
export async function getSubjectDetailByTeacher(
  subjectId: string,
  teacherId: string
) {
  return models.subject.findFirst({
    where: {
      id: subjectId,
      teacherId, // ✅ QUAN TRỌNG: phân quyền theo môn
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          status: true,
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