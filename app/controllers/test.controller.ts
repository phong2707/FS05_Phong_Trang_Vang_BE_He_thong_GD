import { ApplicationController } from ".";
import * as TestService from "@services/test.service";

export class TestController extends ApplicationController {

  async create() {
  if (!this.requireLogin()) return;

  const { chapterId, subjectId, courseId } = this.req.params;

  let scope: "CHAPTER" | "SUBJECT" | "COURSE" | null = null;

  if (chapterId) scope = "CHAPTER";
  if (subjectId) scope = "SUBJECT";
  if (courseId) scope = "COURSE";

  // ✅ FIX: validate sau khi gán
  if (!scope) {
    return this.res.status(400).json({
      success: false,
      message: "Invalid route scope",
    });
  }

  const data = await TestService.createTest(
    this.currentUser!.id,
    {
      ...this.req.body,
      scope,
      chapterId,
      subjectId,
      courseId,
    }
  );

  return this.res.json({ success: true, data });
}


  // ✅ LIST chapter
  async listByChapter() {
    if (!this.requireLogin()) return;

    const { chapterId } = this.req.params;

    const data = await TestService.listTestsByChapter(chapterId);

    return this.res.json({ success: true, data });
  }

  // ✅ LIST subject
  async listBySubject() {
    if (!this.requireLogin()) return;

    const { subjectId } = this.req.params;

    const data = await TestService.listTestsBySubject(subjectId);

    return this.res.json({ success: true, data });
  }

  // ✅ LIST course
  async listByCourse() {
    if (!this.requireLogin()) return;

    const { courseId } = this.req.params;

    const data = await TestService.listTestsByCourse(courseId);

    return this.res.json({ success: true, data });
  }

  async show() {
    if (!this.requireLogin()) return;

    const { id } = this.req.params;

    const data = await TestService.getTestDetail(id);

    return this.res.json({ success: true, data });
  }

  async submit() {
    if (!this.requireLogin()) return;

    const submission = await TestService.submitTest(
      this.currentUser!.id,
      this.req.body
    );

    const graded = await TestService.autoGrade(submission.id);

    return this.res.json({
      success: true,
      data: graded,
    });
  }
}