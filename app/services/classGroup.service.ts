import models from "@models";
import { ApplicationService } from "./application.service";
import { randomUUID } from "crypto";

export class ClassGroupService extends ApplicationService {
  /**
   * Tạo nhóm lớp mới
   */
  async createClassGroup(subjectId: string, name: string) {
    if (!subjectId || !name) {
      throw new Error("subjectId và name là bắt buộc");
    }

    const id = randomUUID();

    await models.$executeRaw`
      INSERT INTO class_groups (id, subject_id, name, status, created_at)
      VALUES (${id}, ${subjectId}, ${name}, 'ACTIVE', datetime('now'))
    `;

    return models.$queryRaw<any[]>`
      SELECT * FROM class_groups WHERE id = ${id}
    `.then(rows => rows[0]);
  }

  /**
   * Sửa thông tin nhóm lớp
   */
  async updateClassGroup(id: string, name?: string, status?: string) {
    if (!id) {
      throw new Error("id là bắt buộc");
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name);
    }
    if (status !== undefined) {
      fields.push("status = ?");
      values.push(status);
    }

    if (fields.length === 0) {
      throw new Error("Phải có ít nhất một trường để cập nhật");
    }

    await models.$executeRawUnsafe(
      `UPDATE class_groups SET ${fields.join(", ")} WHERE id = ?`,
      ...values,
      id
    );

    return models.$queryRaw<any[]>`
      SELECT * FROM class_groups WHERE id = ${id}
    `.then(rows => rows[0]);
  }

  /**
   * Xóa nhóm lớp
   * - Lần 1: xóa thành công
   * - Lần 2: báo không tìm thấy / đã xóa
   */
  async deleteClassGroup(id: string) {
  if (!id) {
    return { deleted: false, reason: "id là bắt buộc" };
  }

  const affected = await models.$executeRawUnsafe(
    "DELETE FROM class_groups WHERE id = ?",
    id
  );

  if (affected === 0) {
    return { deleted: false, reason: "Nhóm lớp không tồn tại hoặc đã bị xóa" };
  }

  return { deleted: true };
}

/**
 * Lấy danh sách nhóm lớp (dùng để test / ghi danh sinh viên)
 */
async list() {
  return models.$queryRaw<any[]>`
    SELECT id, name, status, created_at
    FROM class_groups
    ORDER BY created_at DESC
  `;
}
}