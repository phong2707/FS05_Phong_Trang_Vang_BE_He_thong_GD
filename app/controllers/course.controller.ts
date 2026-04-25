import models from "@models";
import { ApplicationController } from ".";

export class CourseController extends ApplicationController {
  /**
   * GET /courses/:id
   */
  async getCourseById() {
    const courseId = this.req.params.id;

    if (!courseId) {
      return this.res.status(400).json({
        success: false,
        message: "Missing course id",
      });
    }

    const course = await models.course.findUnique({
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

    if (!course) {
      return this.res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return this.res.json({
      success: true,
      data: course,
    });
  }
}
``