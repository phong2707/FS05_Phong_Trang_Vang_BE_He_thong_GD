import { ApplicationController } from '.';
import { TaskmanService } from '@services/taskman.service';

import { uploadTaskmanFile } from "@middlewares/upload.middleware";

export class TaskmanController extends ApplicationController {
  private service = new TaskmanService();

  async createLink() {
    if (!this.requireLogin()) return;

    const { subjectId } = this.req.params;
    const { title, url } = this.req.body;

    const data = await this.service.createLink(subjectId, title, url);
    return this.res.json({ success: true, data });
  }

  async list() {
    if (!this.requireLogin()) return;

    const { subjectId } = this.req.params;
    const data = await this.service.listBySubject(subjectId);

    return this.res.json({ success: true, data });
  }

  async update() {
    if (!this.requireLogin()) return;

    const { id } = this.req.params;
    const data = await this.service.update(id, this.req.body);

    return this.res.json({ success: true, data });
  }

  async toggleVisibility() {
    if (!this.requireLogin()) return;

    const { id } = this.req.params;
    const { isVisible } = this.req.body;

    const data = await this.service.toggleVisibility(id, isVisible);
    return this.res.json({ success: true, data });
  }

  async delete() {
    if (!this.requireLogin()) return;

    const { id } = this.req.params;
    await this.service.delete(id);

    return this.res.json({ success: true });
  }

  async createFile() {
  if (!this.requireLogin()) return;

  // ✅ GỌI MULTER THỦ CÔNG (KEY POINT)
  await new Promise<void>((resolve, reject) => {
    uploadTaskmanFile.single("file")(this.req, this.res, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  const { subjectId } = this.req.params;
  const { title } = this.req.body;
  const file = this.req.file;

  if (!file) {
    return this.res.status(400).json({
      success: false,
      error: "File là bắt buộc",
    });
  }

  const fileUrl = `/uploads/${file.filename}`;
  const fileType = file.mimetype;

  const data = await this.service.createFile(
    subjectId,
    title,
    fileUrl,
    fileType
  );

  return this.res.json({
    success: true,
    data,
  });
}

}
