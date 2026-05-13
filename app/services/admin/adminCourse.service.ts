import models from "@models";

export const adminCourseService = {
  // Lấy danh sách giáo viên (có role TEACHER)
  getTeachers: async () => {
    try {
      const teachers = await models.user.findMany({
        where: {
          roles: {
            some: {
              role: {
                code: "TEACHER"
              }
            }
          }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true
        },
        orderBy: { firstName: "asc" }
      });

      return teachers;
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách khóa học với thống kê
  getCourses: async () => {
    try {
      const courses = await models.course.findMany({
        where: { status: { not: "ARCHIVED" } },
        include: {
          subjects: true,
          admin: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      return courses.map(course => ({
        ...course,
        subjectCount: course.subjects.length
      }));
    } catch (error) {
      throw error;
    }
  }
};
