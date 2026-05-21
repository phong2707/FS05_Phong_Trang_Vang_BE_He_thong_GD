import { ApplicationController } from ".";
import * as QuestionService from "@services/question.service";

export class QuestionController extends ApplicationController {

  async create() {
    if (!this.requireLogin()) return;

    try {
      const data = await QuestionService.createQuestion(
        this.currentUser!.id,
        this.req.body
      );

      return this.res.json({ success: true, data });

    } catch (e: any) {
      return this.res.status(400).json({
        success: false,
        message: e.message,
      });
    }
  }

  async list() {
  if (!this.requireLogin()) return;

  const normalize = (val: any) =>
    typeof val === "string" ? val : undefined;

  const chapterId = normalize(this.req.query.chapterId);
  const subjectId = normalize(this.req.query.subjectId);
  const courseId = normalize(this.req.query.courseId);

  const data = await QuestionService.listQuestions(
    {
      chapterId,
      subjectId,
      courseId,
    },
    this.currentUser!.id
  );

  return this.res.json({ success: true, data });
}

  async update() {
    if (!this.requireLogin()) return;

    const { id } = this.req.params;

    try {
      const data = await QuestionService.updateQuestion(
        id,
        this.currentUser!.id,
        this.req.body
      );

      return this.res.json({ success: true, data });

    } catch (e: any) {
      return this.res.status(400).json({
        success: false,
        message: e.message,
      });
    }
  }

  async delete() {
    if (!this.requireLogin()) return;

    const { id } = this.req.params;

    try {
      const result = await QuestionService.deleteQuestion(
        id,
        this.currentUser!.id
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
}
