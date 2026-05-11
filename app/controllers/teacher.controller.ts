import models from "@models";
import { ApplicationController } from ".";

export class TeacherController extends ApplicationController {
  /**
   * GET /teacher/courses
   */
  async getAssignedCourses() {
    const teacherId = this.req.query.teacherId as string;

    if (!teacherId) {
      return this.res.status(400).json({
        success: false,
        message: "Missing teacherId",
      });
    }

    const courses = await models.course.findMany({
      where: {
        teachers: {
          some: { teacherId },
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

    return this.res.json({
      success: true,
      data: courses,
    });
  }
}