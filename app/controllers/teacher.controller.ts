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

  /**
   * GET /teachers/subjects/:id
   */
  async getAssignedSubjectDetail() {
    if (!this.currentUser) {
      return this.res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { id } = this.req.params;
    const subjects = await getTeacherSubjects(this.currentUser.id);
    const subject = subjects.find((s) => s.id === id);

    if (!subject) {
      return this.res.status(404).json({
        success: false,
        message: "Subject not found or not assigned",
      });
    }

    return this.res.json({
      success: true,
      data: subject,
    });
  }
}
