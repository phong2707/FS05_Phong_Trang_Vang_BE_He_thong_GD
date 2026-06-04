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
   * API Lấy điểm số của sinh viên
   */
  async getMyGrades() {
    try {
      if (!this.currentUser) {
        return this.res
          .status(401)
          .json({ success: false, message: "Vui lòng đăng nhập" });
      }

      const grades = await this.studentLearningService.getStudentGrades(
        this.currentUser.id,
      );

      return this.res.json({
        success: true,
        data: grades,
      });
    } catch (error: any) {
      return this.res
        .status(500)
        .json({ success: false, message: error.message });
    }
  }

  /**
   * API Lấy lịch sử điểm danh của sinh viên
   */
  async getMyAttendances() {
    try {
      if (!this.currentUser) {
        return this.res
          .status(401)
          .json({ success: false, message: "Vui lòng đăng nhập" });
      }

      const attendances =
        await this.studentLearningService.getStudentAttendances(
          this.currentUser.id,
        );

      return this.res.json({
        success: true,
        data: attendances,
      });
    } catch (error: any) {
      return this.res
        .status(500)
        .json({ success: false, message: error.message });
    }
  }

  /**
   * API Sinh viên nộp bài tập tự luận (Assignment)
   * POST /student/assignments/submit
   */
  async submitAssignment() {
    try {
      if (!this.currentUser) {
        return this.res
          .status(401)
          .json({ success: false, message: "Vui lòng đăng nhập" });
      }

      const { testId, classGroupId, essayAnswer } = this.req.body;

      if (!testId || !classGroupId || !essayAnswer) {
        return this.res
          .status(400)
          .json({ success: false, message: "Thiếu thông tin bài nộp" });
      }

      const result = await this.studentLearningService.submitStudentAssignment(
        this.currentUser.id,
        { testId, classGroupId, essayAnswer },
      );

      return this.res.json({ success: true, data: result });
    } catch (error: any) {
      return this.res
        .status(400)
        .json({ success: false, message: error.message });
    }
  }

  /**
   * API Sinh viên bắt đầu làm bài kiểm tra (Test/Quiz)
   * POST /student/tests/start
   */
  async startTest() {
    try {
      if (!this.currentUser) {
        return this.res
          .status(401)
          .json({ success: false, message: "Vui lòng đăng nhập" });
      }

      // Payload can contain testId for fixed tests, or scope/rules for random tests
      const payload = this.req.body;

      const result = await this.studentLearningService.startStudentTest(
        this.currentUser.id,
        payload,
      );

      return this.res.json({ success: true, data: result });
    } catch (error: any) {
      return this.res
        .status(400)
        .json({ success: false, message: error.message });
    }
  }

  /**
   * API Sinh viên nộp bài kiểm tra (Test/Quiz)
   * POST /student/tests/submit
   */
  async submitTest() {
    try {
      if (!this.currentUser) {
        return this.res
          .status(401)
          .json({ success: false, message: "Vui lòng đăng nhập" });
      }

      const { testId, classGroupId, sessionToken, answers } = this.req.body;

      if (!testId || !classGroupId || !sessionToken || !answers) {
        return this.res
          .status(400)
          .json({ success: false, message: "Thiếu thông tin bài nộp" });
      }

      const result = await this.studentLearningService.submitStudentTest(
        this.currentUser.id,
        { testId, classGroupId, sessionToken, answers },
      );

      return this.res.json({ success: true, data: result });
    } catch (error: any) {
      return this.res
        .status(400)
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
