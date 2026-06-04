import { ApplicationController } from ".";
import * as AssignmentService from "@services/assignment.service";


export class AssignmentController extends ApplicationController {

  /**
   * ✅ Upload bài
   */
  async submit() {
  if (!this.requireLogin()) return;

  try {
    const { testId, classGroupId, essayAnswer } = this.req.body;

    if (!essayAnswer || !essayAnswer.trim()) {
      return this.res.status(400).json({
        success: false,
        message: "Nội dung bài làm không được bỏ trống",
      });
    }

    const data = await AssignmentService.submitAssignment(
      this.currentUser!.id,
      {
        testId,
        classGroupId,
        essayAnswer, // ✅ gửi text HTML
      }
    );

    return this.res.json({ success: true, data });
  } catch (e: any) {
    return this.res.status(400).json({
      success: false,
      message: e.message,
    });
  }
}

  /**
   * ✅ chấm bài
   */
 async grade() {
  if (!this.requireLogin()) return;

  try {
    const submissionId = this.req.params.id;

    const {
      score,
      feedback,
      useAI,
      preview,
      maxMark,
    } = this.req.body;

    const result = await AssignmentService.gradeAssignment(
      this.currentUser!.id,
      submissionId,
      {
        score,
        feedback,
        useAI,
        preview,
        maxMark,
      }
    );

    return this.res.json({
      success: true,
      data: result,
    });
  } catch (e: any) {
    return this.res.status(400).json({
      success: false,
      message: e.message,
    });
  }
}
  /**
   * ✅ danh sách bài nộp
   */
  async list() {
    if (!this.requireLogin()) return;

    const { testId } = this.req.params;

    const data = await AssignmentService.listSubmissions(testId);

    return this.res.json({ success: true, data });
  }
}