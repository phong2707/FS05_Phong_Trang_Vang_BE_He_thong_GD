import models from "@models";

// 1. Giáo viên xem danh sách khóa học được phân công
export async function getTeacherCourses(teacherId: string) {
  return models.course.findMany({
    where: {
      teachers: {
        some: {
          teacherId,
        },
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      createdAt: true,
    },
  });
}

// 2. Xem chi tiết khóa học
export async function getCourseDetail(courseId: string) {
  return models.course.findUnique({
    where: { id: courseId },
    include: {
      subjects: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });
}