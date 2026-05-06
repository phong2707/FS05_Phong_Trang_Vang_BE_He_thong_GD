import { ApplicationController } from ".";
import { ClassGroupUserService } from "@services/classGroupUser.service";

export class ClassGroupUserController extends ApplicationController {
  private service = new ClassGroupUserService();

  /**
   * POST /class-groups/:classGroupId/students
   */
  async addStudent() {
    if (!this.requireLogin()) return;

    const { classGroupId } = this.req.params;
    const { email } = this.req.body;

    if (!email) {
      return this.res.status(400).json({
        success: false,
        message: "email là bắt buộc",
      });
    }

    try {
      const result = await this.service.enrollStudent(
        classGroupId,
        email
      );
      return this.res.json({ success: true, data: result });
    } catch (error: unknown) {
  const message =
    error instanceof Error ? error.message : "Có lỗi xảy ra";

  return this.res.status(400).json({
    success: false,
    message,
  });
}
  }

  /**
   * GET /class-groups/:classGroupId/students
   */
  async listStudents() {
    if (!this.requireLogin()) return;

    const { classGroupId } = this.req.params;

    const students = await this.service.getStudents(classGroupId);
    return this.res.json({ success: true, data: students });
  }

  /**
   * DELETE /class-groups/:classGroupId/students/:studentId
   */
  async removeStudent() {
  if (!this.requireLogin()) return;

  const { classGroupId, studentId } = this.req.params;

  // ✅ NHẬN KẾT QUẢ TỪ SERVICE
  const result = await this.service.removeStudent(classGroupId, studentId);

  // ✅ PHẢI RETURN RESPONSE
  return this.res.json({
    success: true,
    data: result,
  });
}
}