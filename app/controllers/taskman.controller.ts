import { ApplicationController } from ".";
import { BeforeAction } from "ts-rails";
import { TaskmanService } from "@services/taskman.service";
import { uploadTaskmanFile } from "@middlewares/upload.middleware";
import { RequireSubjectTeacherMiddleware } from "@middlewares/require_subject_teacher.middleware";

export class TaskmanController extends ApplicationController {
  // 1. Khai báo (Nhớ có ngoặc kép " ")
  // static beforeActions = [
  //     BeforeAction("checkTeacherRole", {
  //       only: ["createLink", "createFile", "update", "toggleVisibility", "reorder", "delete"] 
  //     })
  // ];  

  private service = new TaskmanService();

  // // 2. Tên hàm phải khớp 100% với chuỗi ở trên và nằm TRONG class này
  // async checkTeacherRole() {
  //   return new Promise((resolve, reject) => {
  //     const middleware = new RequireSubjectTeacherMiddleware();
  //     middleware.execute(this.req, this.res, (err?: any) => {
  //       if (err) return reject(err);
  //       resolve(true); 
  //     });
  //   });
  // }
  // ✅ CREATE LINK
  async createLink() {
    if (!this.requireLogin()) return;

    try {
      const { chapterId } = this.req.params;
      const { title, url } = this.req.body;

      if (!chapterId || !title || !url) {
        return this.res.status(400).json({
          success: false,
          message: "chapterId, title, url là bắt buộc",
        });
      }

      const data = await this.service.createLink(chapterId, title, url);

      return this.res.json({ success: true, data });
    } catch (err: any) {
      return this.res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  // ✅ LIST
  async list() {
    if (!this.requireLogin()) return;

    try {
      const { chapterId } = this.req.params;

      const data = await this.service.listByChapter(chapterId);

      return this.res.json({ success: true, data });
    } catch (err: any) {
      return this.res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  // ✅ UPDATE
  async update() {
    if (!this.requireLogin()) return;

    try {
      const { id } = this.req.params;
      const { title, url } = this.req.body;

      const data = await this.service.update(id, { title, url });

      return this.res.json({ success: true, data });
    } catch (err: any) {
      return this.res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  // ✅ TOGGLE
  async toggleVisibility() {
    if (!this.requireLogin()) return;

    try {
      const { id } = this.req.params;
      const { isVisible } = this.req.body;

      const data = await this.service.toggleVisibility(id, isVisible);

      return this.res.json({ success: true, data });
    } catch (err: any) {
      return this.res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  // ✅ DELETE
  async delete() {
    if (!this.requireLogin()) return;

    try {
      const { id } = this.req.params;

      const data = await this.service.deleteWithFile(id);

      return this.res.json({ success: true, data });
    } catch (err: any) {
      return this.res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  // ✅ LIST BY SUBJECT (nhóm theo chapter)
  async listBySubject() {
    if (!this.requireLogin()) return;

    try {
      const { subjectId } = this.req.params;

      if (!subjectId) {
        return this.res.status(400).json({
          success: false,
          message: "subjectId là bắt buộc",
        });
      }

      const data = await this.service.listBySubject(subjectId);

      return this.res.json({ success: true, data });
    } catch (err: any) {
      return this.res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  // ✅ REORDER (drag & drop)
  async reorder() {
    if (!this.requireLogin()) return;

    try {
      const { items } = this.req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return this.res.status(400).json({
          success: false,
          message: "items phải là array không rỗng",
        });
      }

      // Validate mỗi item có id và sortOrder
      for (const item of items) {
        if (!item.id || item.sortOrder === undefined) {
          return this.res.status(400).json({
            success: false,
            message: "Mỗi item phải có id và sortOrder",
          });
        }
      }

      const data = await this.service.reorder(items);

      return this.res.json({ success: true, data });
    } catch (err: any) {
      return this.res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  // ✅ CREATE FILE
  async createFile() {
    if (!this.requireLogin()) return;

    try {
      await new Promise((resolve, reject) => {
        uploadTaskmanFile.single("file")(this.req, this.res, (err) => {
          if (err) return reject(err);
          resolve(null);
        });
      });

      const { chapterId } = this.req.params;
      const { title } = this.req.body;
      const file = this.req.file;

      if (!file || !chapterId) {
        return this.res.status(400).json({
          success: false,
          message: "Thiếu file hoặc chapterId",
        });
      }

      const data = await this.service.createFile(
        chapterId,
        title || file.originalname,
        file.path,
        file.mimetype,
        file.originalname
      );

      return this.res.json({ success: true, data });

    } catch (err: any) {
      return this.res.status(400).json({
        success: false,
        message: err.message || "Upload thất bại",
      });
    }
  }
}