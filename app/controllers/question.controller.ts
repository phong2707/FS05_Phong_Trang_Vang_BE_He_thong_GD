import { ApplicationController } from ".";
import * as QuestionService from "@services/question.service";

export class QuestionController extends ApplicationController {
  async create() {
    if (!this.requireLogin()) return;

    try {
      const data = await QuestionService.createQuestion(
        this.currentUser!.id,
        this.req.body,
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

    const normalize = (val: any) => (typeof val === "string" ? val : undefined);

    const chapterId = normalize(this.req.query.chapterId);
    const subjectId = normalize(this.req.query.subjectId);
    const courseId = normalize(this.req.query.courseId);

    // Áp dụng Cách 1: Kiểm tra tồn tại của subjectId trước khi thực hiện logic tiếp theo
    if (!subjectId) {
      return this.res.status(400).json({
        success: false,
        message: "Thiếu thông tin môn học (subjectId).",
      });
    }

    // Đọc params filter + pagination từ query
    const { format, typeId, search, difficulty, page, pageSize } = this.req
      .query as any;

    const filter: any = {};
    if (format) filter.questionFormat = format;
    if (typeId) filter.typeId = typeId;
    if (search) filter.search = search;
    if (difficulty) filter.difficulty = difficulty;
    if (chapterId) filter.chapterId = chapterId;

    const pagination =
      page || pageSize
        ? { page: Number(page || 1), pageSize: Number(pageSize || 10) }
        : undefined;

    const data = await QuestionService.listQuestions(
      subjectId,
      this.currentUser!.id,
      filter,
      pagination,
    );

    return this.res.json({ success: true, data });
  }

  // GET /question-types
  async types() {
    if (!this.requireLogin()) return;

    const data = await QuestionService.getQuestionTypes();
    return this.res.json({ success: true, data });
  }

  // GET /questions/:id
  async show() {
    if (!this.requireLogin()) return;

    const { id } = this.req.params;

    try {
      const isAdmin = (this.res.locals as any).isAdmin || false;
      const data = await QuestionService.getQuestionDetail(
        id,
        this.currentUser!.id,
        isAdmin,
      );
      return this.res.json({ success: true, data });
    } catch (e: any) {
      return this.res.status(400).json({ success: false, message: e.message });
    }
  }

  async update() {
    if (!this.requireLogin()) return;

    const { id } = this.req.params;

    try {
      const data = await QuestionService.updateQuestion(
        id,
        this.currentUser!.id,
        this.req.body,
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
        this.currentUser!.id,
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
