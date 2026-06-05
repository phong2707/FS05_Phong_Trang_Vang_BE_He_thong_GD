import { ApplicationController } from ".";
import { ClassGroupService } from "@services/classGroup.service";

export class ClassGroupController extends ApplicationController {
  private service = new ClassGroupService();

  private getErrorStatus(message: string) {
    if (message.includes("Không tìm thấy")) return 404;
    if (
      message.includes("đã đầy") ||
      message.includes("đã thuộc lớp khác") ||
      message.includes("Sĩ số mới nhỏ hơn")
    ) return 409;
    return 400;
  }

  async index() {
    if (!this.requireLogin()) return;

    try {
      const data = await this.service.findAll(this.req.query);
      return this.res.json({ success: true, data });
    } catch (err: any) {
      return this.res.status(400).json({ success: false, message: err.message });
    }
  }

  async show() {
    if (!this.requireLogin()) return;

    try {
      const data = await this.service.findOne(this.req.params.id);
      return this.res.json({ success: true, data });
    } catch (err: any) {
      return this.res.status(this.getErrorStatus(err.message)).json({ success: false, message: err.message });
    }
  }

  async createClassGroup() {
    if (!this.requireLogin()) return;

    try {
      const data = await this.service.createClassGroup(this.req.body);
      return this.res.status(201).json({ success: true, data });
    } catch (err: any) {
      return this.res.status(this.getErrorStatus(err.message)).json({ success: false, message: err.message });
    }
  }

  async updateClassGroup() {
    if (!this.requireLogin()) return;

    try {
      const data = await this.service.updateClassGroup(this.req.params.id, this.req.body);
      return this.res.json({ success: true, data });
    } catch (err: any) {
      return this.res.status(this.getErrorStatus(err.message)).json({ success: false, message: err.message });
    }
  }

  async deleteClassGroup() {
    if (!this.requireLogin()) return;

    try {
      const data = await this.service.deactivate(this.req.params.id);
      return this.res.json({ success: true, data, message: "Huỷ kích hoạt nhóm lớp thành công" });
    } catch (err: any) {
      return this.res.status(this.getErrorStatus(err.message)).json({ success: false, message: err.message });
    }
  }

  async students() {
    if (!this.requireLogin()) return;

    try {
      const data = await this.service.getStudents(this.req.params.id);
      return this.res.json({ success: true, data });
    } catch (err: any) {
      return this.res.status(this.getErrorStatus(err.message)).json({ success: false, message: err.message });
    }
  }

  async addStudents() {
    if (!this.requireLogin()) return;

    const userIds = this.req.body?.userIds;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return this.res.status(400).json({ success: false, message: "Danh sách userIds không hợp lệ" });
    }

    try {
      const data = await this.service.addStudents(this.req.params.id, { userIds });
      return this.res.json({ success: true, data });
    } catch (err: any) {
      return this.res.status(this.getErrorStatus(err.message)).json({ success: false, message: err.message });
    }
  }

  async removeStudent() {
    if (!this.requireLogin()) return;

    try {
      const data = await this.service.removeStudent(this.req.params.id, this.req.params.uid);
      return this.res.json({ success: true, data, message: "Đã xoá sinh viên khỏi lớp" });
    } catch (err: any) {
      return this.res.status(this.getErrorStatus(err.message)).json({ success: false, message: err.message });
    }
  }

  async teachers() {
    if (!this.requireLogin()) return;

    try {
      const data = await this.service.getAvailableTeachers(this.req.params.id);
      return this.res.json({ success: true, data });
    } catch (err: any) {
      return this.res.status(this.getErrorStatus(err.message)).json({ success: false, message: err.message });
    }
  }
}
