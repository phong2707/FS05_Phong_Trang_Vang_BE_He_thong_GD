import { ApplicationController } from ".";
import { StudentLearningService } from "../services/studentLearning.service";

export class StudentLearningController extends ApplicationController {
  private studentLearningService = new StudentLearningService();

  /**
   * API Xem lịch học của sinh viên
   */
  async getSchedules() {
    try {
      if (!this.currentUser) {
        return this.res
          .status(401)
          .json({ success: false, message: "Vui lòng đăng nhập" });
      }

      const schedules = await this.studentLearningService.getStudentSchedule(
        this.currentUser.id,
      );

      return this.res.json({
        success: true,
        data: schedules,
      });
    } catch (error: any) {
      return this.res
        .status(500)
        .json({ success: false, message: error.message });
    }
  }

  /**
   * API Xem danh sách môn học sinh viên đang tham gia
   */
  async getMySubjects() {
    try {
      if (!this.currentUser) {
        return this.res
          .status(401)
          .json({ success: false, message: "Vui lòng đăng nhập" });
      }

      const subjects = await this.studentLearningService.getEnrolledSubjects(
        this.currentUser.id,
      );

      return this.res.json({
        success: true,
        data: subjects,
      });
    } catch (error: any) {
      return this.res
        .status(500)
        .json({ success: false, message: error.message });
    }
  }

  /**
   * API Lấy tài liệu của một môn học (videos, taskmen, tests)
   */
  async getMaterials() {
    try {
      if (!this.currentUser) {
        return this.res
          .status(401)
          .json({ success: false, message: "Vui lòng đăng nhập" });
      }

      const subjectId = this.req.params.subjectId;
      if (!subjectId) {
        return this.res
          .status(400)
          .json({ success: false, message: "Thiếu subjectId" });
      }

      const materials = await this.studentLearningService.getSubjectMaterials(
        this.currentUser.id,
        subjectId,
      );

      return this.res.json({
        success: true,
        data: materials,
      });
    } catch (error: any) {
      return this.res
        .status(403)
        .json({ success: false, message: error.message });
    }
  }

  /**
 * API: Lấy danh sách bài test của sinh viên
 * GET /student/tests
 */
async getMyTests() {
  try {
    if (!this.currentUser) {
      return this.res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập",
      });
    }

    const tests = await this.studentLearningService.getStudentTests(
      this.currentUser.id,
    );

    return this.res.json({
      success: true,
      data: tests,
    });
  } catch (error: any) {
    return this.res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
}
