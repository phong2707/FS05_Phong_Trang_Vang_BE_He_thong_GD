import { ApplicationController } from ".";
import { getTeacherSubjects } from "@services/subject.service";
import {
  completeTeacherAttendanceSession,
  createTeacherAttendanceSession,
  getTeacherSessionAttendanceRecords,
  getTeacherSubjectAttendanceSessions,
  getTeacherSubjectAttendanceStats,
  updateTeacherSessionAttendanceRecords,
} from "@services/teacherAttendance.service";
import { getStudentsBySubject, getStudentsByClassGroup } from "@services/teacherStudent.service";

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

  /**
   * GET /v1/teacher/subjects/:id/attendance/sessions
   */
  async getAttendanceSessions() {
    if (!this.currentUser) {
      return this.res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = this.req.params;
    const data = await getTeacherSubjectAttendanceSessions(this.currentUser.id, id);

    if (data === null) {
      return this.res.status(404).json({ success: false, message: "Subject not found or not assigned" });
    }

    return this.res.json({ success: true, data });
  }

  /**
   * GET /v1/teacher/subjects/:id/attendance/stats
   */
  async getAttendanceStats() {
    if (!this.currentUser) {
      return this.res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = this.req.params;
    const data = await getTeacherSubjectAttendanceStats(this.currentUser.id, id);

    if (data === null) {
      return this.res.status(404).json({ success: false, message: "Subject not found or not assigned" });
    }

    return this.res.json({ success: true, data });
  }

  /**
   * GET /v1/teacher/subjects/:id/attendance/sessions/:sessionId/records
   */
  async getAttendanceSessionRecords() {
    if (!this.currentUser) {
      return this.res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id, sessionId } = this.req.params;
    const data = await getTeacherSessionAttendanceRecords(this.currentUser.id, id, sessionId);

    if (data === null) {
      return this.res.status(404).json({ success: false, message: "Subject not found or not assigned" });
    }

    return this.res.json({ success: true, data });
  }

  /**
   * POST /v1/teacher/subjects/:id/attendance/sessions
   */
  async createAttendanceSession() {
    if (!this.currentUser) {
      return this.res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = this.req.params;
    const payload = this.req.body;
    const data = await createTeacherAttendanceSession(this.currentUser.id, id, payload);

    if (data === null) {
      return this.res.status(404).json({ success: false, message: "Subject/class not found or not assigned" });
    }

    return this.res.status(201).json({ success: true, data, message: "Created attendance session successfully" });
  }

  /**
   * PUT /v1/teacher/subjects/:id/attendance/sessions/:sessionId/records
   */
  async updateAttendanceSessionRecords() {
    if (!this.currentUser) {
      return this.res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id, sessionId } = this.req.params;
    const payload = this.req.body;
    const data = await updateTeacherSessionAttendanceRecords(this.currentUser.id, id, sessionId, payload);

    if (data === null) {
      return this.res.status(404).json({ success: false, message: "Session not found or not assigned" });
    }

    if (!data.success && data.reason === "SESSION_COMPLETED") {
      return this.res.status(409).json({
        success: false,
        message: "Attendance session is completed and cannot be modified",
      });
    }

    return this.res.json({ success: true, data, message: "Updated attendance records successfully" });
  }

  /**
   * PATCH /v1/teacher/subjects/:id/attendance/sessions/:sessionId/complete
   */
  async completeAttendanceSession() {
    if (!this.currentUser) {
      return this.res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id, sessionId } = this.req.params;
    const data = await completeTeacherAttendanceSession(this.currentUser.id, id, sessionId);

    if (data === null) {
      return this.res.status(404).json({ success: false, message: "Session not found or not assigned" });
    }

    return this.res.json({ success: true, data, message: "Completed attendance session successfully" });
  }

  /**
   * GET /v1/teacher/subjects/:id/students
   * Query params: ?classGroupId=xxx (optional, để lọc theo lớp)
   */
  async getSubjectStudents() {
    if (!this.currentUser) {
      return this.res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = this.req.params;
    const { classGroupId } = this.req.query as { classGroupId?: string };

    let data: any = null;

    if (classGroupId) {
      data = await getStudentsByClassGroup(this.currentUser.id, id, String(classGroupId));
    } else {
      data = await getStudentsBySubject(this.currentUser.id, id);
    }

    if (data === null) {
      return this.res.status(404).json({ success: false, message: "Subject not found or not assigned" });
    }

    return this.res.json({ success: true, data });
  }
}
