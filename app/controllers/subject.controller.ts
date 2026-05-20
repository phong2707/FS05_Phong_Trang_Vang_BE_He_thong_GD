import { ApplicationController } from ".";
import {
  getSubjectDetailByTeacher,
  getTeacherSubjects,
} from "@services/subject.service";

export class SubjectController extends ApplicationController {
  /**
   * ✅ GET /api/v1/subjects
   * Danh sách môn học được phân công cho giáo viên hiện tại
   */
  async index() {
    if (!this.requireLogin()) return;

    const subjects = await getTeacherSubjects(this.currentUser!.id);

    return this.res.json({
      success: true,
      data: subjects,
    });
  }

  /**
   * ✅ GET /api/v1/subjects/:id
   * Chỉ giáo viên được phân công mới xem được
   */
  async show() {
    if (!this.requireLogin()) return;

    const { id } = this.req.params;

    const subject = await getSubjectDetailByTeacher(
      id,
      this.currentUser!.id // ✅ ! vì đã requireLogin
    );

    if (!subject) {
      return this.res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem môn học này",
      });
    }

    return this.res.json({
      success: true,
      data: subject,
    });
  }
}
