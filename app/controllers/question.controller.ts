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

    const { subjectId } = this.req.params;

    const data = await QuestionService.listQuestions(
      subjectId,
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
