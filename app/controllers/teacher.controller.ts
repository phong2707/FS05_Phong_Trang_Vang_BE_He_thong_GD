import { ApplicationController } from ".";
import { getTeacherSubjects } from "@services/subject.service";

export class TeacherController extends ApplicationController {
  /**
   * GET /teachers/subjects
   */
  async getAssignedSubjects() {
    if (!this.currentUser) {
      return this.res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const subjects = await getTeacherSubjects(this.currentUser.id);

    return this.res.json({
      success: true,
      data: subjects,
    });
  }
}