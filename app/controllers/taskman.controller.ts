import { ApplicationController } from ".";
import { TaskmanService } from "@services/taskman.service";
import { uploadTaskmanFile } from "@middlewares/upload.middleware";

export class TaskmanController extends ApplicationController {
  private service = new TaskmanService();

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

      const data = await this.service.delete(id);

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