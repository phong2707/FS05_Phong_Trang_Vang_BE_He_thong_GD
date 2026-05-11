import { ApplicationController } from ".";
import { getSubjectDetailByTeacher } from "@services/subject.service";

export class SubjectController extends ApplicationController {
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