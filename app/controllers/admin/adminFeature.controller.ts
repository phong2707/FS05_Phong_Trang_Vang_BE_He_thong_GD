import { Prisma } from "@db";
import { buildFeatureTree } from "@middlewares/adminFeatures.middleware";
import models from "@models";
import {
  FeatureCreateValidator,
  FeatureUpdateValidator,
} from "@validators/admin.validator";
import { randomUUID } from "crypto";
import { AdminController } from "./admin.controller";

export class AdminFeatureController extends AdminController {
  
  // 1. LẤY DANH SÁCH TÍNH NĂNG (Đã sửa lỗi trả về process.features)
  async index() {
    try {
      const search = String(this.req.query.search || "").trim();
      const sortBy = String(this.req.query.sortBy || "code");
      const filterType = String(this.req.query.filterType || "");

      const where: Prisma.FeatureWhereInput = { deleted: false };
      if (search) {
        where.OR = [
          { code: { contains: search } },
          { name: { contains: search } },
        ];
      }
      if (filterType) where.type = filterType;

      const flat = await models.feature.findMany({
        where,
        include: { permissions: { where: { deleted: false } } },
        orderBy: { [sortBy]: "asc" },
      });

      const featuresTree = buildFeatureTree(flat);

      // SỬA Ở ĐÂY: Trả về cục JSON chuẩn mà React đang mong đợi
       this.res.json({ featuresTree, features: flat });
    } catch (error: any) {
       this.res.status(500).json({ success: false, message: error.message });
    }
  }

  // 2. LẤY CHI TIẾT MỘT TÍNH NĂNG
  async show() {
    try {
      const feature = await models.feature.findFirst({
        where: { id: this.req.params.id, deleted: false },
        include: {
          permissions: { where: { deleted: false } },
          parent: true,
        },
      });
      if (!feature) return this.res.status(404).json({ success: false, message: "Không tìm thấy tính năng" });
      
      const features = await models.feature.findMany({
        where: { deleted: false },
        orderBy: { code: "asc" },
      });
      
      return this.res.json({ feature, features });
    } catch (error: any) {
      return this.res.status(500).json({ success: false, message: error.message });
    }
  }

  // 3. TẠO MỚI TÍNH NĂNG
  async create() {
    try {
      const data = await this.params(FeatureCreateValidator).permit(
        "code", "name", "description", "type", "parentId", "sortOrder",
      );
      const { code, name, description, type, parentId, sortOrder } = data;

      const existing = await models.feature.findFirst({
        where: { code, deleted: false },
      });
      if (existing) {
        return this.res.status(400).json({ success: false, message: "Mã tính năng đã tồn tại" });
      }

      const id = randomUUID();
      const now = new Date().toISOString();
      const sortOrderVal = parseInt(String(sortOrder), 10) || 0;
      
      await models.$executeRawUnsafe(
        `INSERT INTO features (id, created_at, updated_at, deleted, code, name, description, type, parent_id, sort_order) VALUES (?, ?, ?, 0, ?, ?, ?, 'MENU_GROUP', ?, ?)`,
        id, now, now, code || "", name || "", description || "", parentId || null, sortOrderVal,
      );
      const feature = await models.feature.findUniqueOrThrow({ where: { id } });

      return this.res.json({ success: true, message: "Tạo tính năng thành công", data: feature });
    } catch (error: any) {
      return this.res.status(500).json({ success: false, message: error.message });
    }
  }

  // 4. CẬP NHẬT TÍNH NĂNG
  async update() {
    try {
      const id = this.req.params.id;
      const feature = await models.feature.findFirst({
        where: { id, deleted: false },
        include: { permissions: true },
      });
      
      if (!feature) return this.res.status(404).json({ success: false, message: "Không tìm thấy tính năng" });
      if (feature.type === "FEATURE") {
        return this.res.status(400).json({ success: false, message: "Không thể chỉnh sửa tính năng loại FEATURE" });
      }

      const data = await this.params(FeatureUpdateValidator).permit(
        "code", "name", "description", "type", "parentId", "sortOrder",
      );
      const { code, name, description, type, parentId, sortOrder } = data;

      const updateData: Prisma.FeatureUpdateInput = {};
      if (code !== undefined) updateData.code = code;
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (type !== undefined) updateData.type = type;
      if (parentId !== undefined) {
        updateData.parent = parentId ? { connect: { id: parentId } } : { disconnect: true };
      }
      if (sortOrder !== undefined) updateData.sortOrder = parseInt(String(sortOrder), 10) || 0;

      if (Object.keys(updateData).length) {
        await models.feature.update({ where: { id }, data: updateData });
      }

      return this.res.json({ success: true, message: "Cập nhật tính năng thành công" });
    } catch (error: any) {
      return this.res.status(500).json({ success: false, message: error.message });
    }
  }

  // 5. XÓA TÍNH NĂNG
  async destroy() {
    try {
      const id = this.req.params.id;
      const feature = await models.feature.findFirst({
        where: { id, deleted: false },
        include: { permissions: true },
      });
      
      if (!feature) return this.res.status(404).json({ success: false, message: "Không tìm thấy tính năng" });
      if (feature.type === "FEATURE") {
        return this.res.status(400).json({ success: false, message: "Không thể xóa tính năng loại FEATURE" });
      }

      await models.feature.update({ where: { id }, data: { deleted: true } });
      return this.res.json({ success: true, message: "Xóa tính năng thành công" });
    } catch (error: any) {
      return this.res.status(500).json({ success: false, message: error.message });
    }
  }

  // 6. SẮP XẾP LẠI (DRAG & DROP)
  async reorder() {
    try {
      let items = this.req.body?.items as Record<string, { parentId?: string; sortOrder?: string }> | undefined;
      if (!items || typeof items !== "object") {
        items = {};
        const body = this.req.body || {};
        for (const [key, value] of Object.entries(body)) {
          const m = String(key).match(/^items\[([^\]]+)\]\[(parentId|sortOrder)\]$/);
          if (m) {
            const [, id, field] = m;
            if (!items![id]) items![id] = {};
            (items as Record<string, Record<string, string>>)[id][field as "parentId" | "sortOrder"] = String(value ?? "");
          }
        }
      }
      
      if (Object.keys(items).length === 0) {
        return this.res.status(400).json({ success: false, message: "Dữ liệu sắp xếp không hợp lệ" });
      }

      for (const [id, it] of Object.entries(items)) {
        if (!id) continue;
        const updates: string[] = [];
        const params: (string | number)[] = [];
        if (it?.parentId !== undefined) {
          if (it.parentId) {
            updates.push("parent_id = ?"); params.push(it.parentId);
          } else {
            updates.push("parent_id = NULL");
          }
        }
        if (it?.sortOrder !== undefined) {
          updates.push("sort_order = ?"); params.push(parseInt(String(it.sortOrder), 10) || 0);
        }
        if (updates.length) {
          params.push(id);
          await models.$executeRawUnsafe(`UPDATE features SET ${updates.join(", ")} WHERE id = ?`, ...params);
        }
      }
      return this.res.json({ success: true, message: "Cập nhật thứ tự thành công" });
    } catch (error: any) {
      return this.res.status(500).json({ success: false, message: error.message });
    }
  }
}