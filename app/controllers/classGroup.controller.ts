import { ApplicationController } from ".";
import { ClassGroupService } from "@services/classGroup.service";

export class ClassGroupController extends ApplicationController {
  private service = new ClassGroupService();

  /**
   * POST /class-groups
   * Body: { subjectId, name }
   */
  async createClassGroup() {
    const { subjectId, name } = this.req.body;
    if (!subjectId || !name) {
      return this.res.status(400).json({
        success: false,
        message: "subjectId và name là bắt buộc",
      });
    }
    try {
      const group = await this.service.createClassGroup(subjectId, name);
      return this.res.json({ success: true, data: group });
    } catch (err: any) {
      return this.res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * PUT /class-groups/:id
   * Body: { name?, status? }
   */
  async updateClassGroup() {
    const { id } = this.req.params;
    const { name, status } = this.req.body;
    if (!id) {
      return this.res.status(400).json({ success: false, message: "id là bắt buộc" });
    }
    if (name === undefined && status === undefined) {
      return this.res.status(400).json({ success: false, message: "Phải có name hoặc status để cập nhật" });
    }
    try {
      const group = await this.service.updateClassGroup(id, name, status);
      return this.res.json({ success: true, data: group });
    } catch (err: any) {
      return this.res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * DELETE /class-groups/:id
   */
  

async delete() {
  const { id } = this.req.params;

  const result = await this.service.deleteClassGroup(id);

  if (!result.deleted) {
    return this.res.status(404).json({
      success: false,
      message: result.reason,
    });
  }

  return this.res.json({
    success: true,
    message: "Xóa nhóm lớp thành công",
  });
}

}
