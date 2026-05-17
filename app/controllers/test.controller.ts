import { ApplicationController } from ".";
import * as TestService from "@services/test.service";

export class TestController extends ApplicationController {

  async create() {
    if (!this.requireLogin()) return;

    try {
      const data = await TestService.createTest(
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
    const data = await TestService.listTests(subjectId);

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

    // ✅ auto grade nếu quiz
    const graded = await TestService.autoGrade(submission.id);

    return this.res.json({
      success: true,
      data: graded,
    });
  }
}