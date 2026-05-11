import { Prisma, User, UserToRole } from "@db";
import models from "@models";
import {
  RoleCreateValidator,
  RoleUpdateValidator,
} from "@validators/admin.validator";
import { AdminController } from "./admin.controller";

const DEFAULT_PER_PAGE = 10;
const PER_PAGE_OPTIONS = [10, 25, 50];

export class AdminRoleController extends AdminController {
  
  // 1. LẤY DANH SÁCH VAI TRÒ
  async index() {
    const search = String(this.req.query.search || "").trim();
    const sortBy = String(this.req.query.sortBy || "name");
    const sortOrder = String(this.req.query.sortOrder || "asc") as "asc" | "desc";
    const page = Math.max(1, parseInt(String(this.req.query.page || "1"), 10));
    const perPage = Math.min(50, Math.max(10, parseInt(String(this.req.query.perPage || "10"), 10)));

    const where: Prisma.RoleWhereInput = { deleted: false };
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [roles, total] = await Promise.all([
      models.role.findMany({
        where,
        include: {
          permissions: {
            include: { permission: { include: { feature: true } } },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      models.role.count({ where }),
    ]);

    // Trả về JSON cho React (bao gồm cả data và thông tin phân trang)
    this.res.json(roles);
  }

  // 2. LẤY CHI TIẾT VAI TRÒ
  async show() {
    const roleId = this.req.params.id;
    const role = await models.role.findFirst({
      where: { id: roleId, deleted: false },
      include: {
        permissions: {
          include: { permission: { include: { feature: true } } },
        },
      },
    });
    if (!role) return this.res.status(404).json({ success: false, message: "Không tìm thấy vai trò" });

    const features = await models.feature.findMany({
      where: { deleted: false },
      include: { permissions: { where: { deleted: false } } },
    });

    const usersInRole = await models.userToRole.findMany({
      where: { roleId },
      include: { user: true },
    });

    const assignedUsers = usersInRole.map((ur: UserToRole & { user: User }) => ur.user);

    return this.res.json({
      role,
      features,
      assignedUsers,
      totalAssigned: assignedUsers.length
    });
  }

  // 3. TẠO VAI TRÒ MỚI
  async create() {
    try {
      const data = await this.params(RoleCreateValidator).permit("code", "name", "description");
      const { code, name, description } = data;

      const existing = await models.role.findFirst({ where: { code, deleted: false } });
      if (existing) {
        return this.res.status(400).json({ success: false, message: "Mã vai trò đã tồn tại" });
      }

      const role = await models.role.create({
        data: {
          code: code || "",
          name: name || "",
          description: description || "",
        },
      });

      return this.res.json({ success: true, message: "Tạo vai trò thành công", data: role });
    } catch (error: any) {
      return this.res.status(500).json({ success: false, message: error.message });
    }
  }

  // 4. CẬP NHẬT VAI TRÒ
  async update() {
    try {
      const id = this.req.params.id;
      const hasPermissionIds = "permissionIds" in (this.req.body || {});
      const data = await this.params(RoleUpdateValidator).permit(
        "code", "name", "description",
        ...(hasPermissionIds ? ["permissionIds"] : []),
      );
      const { code, name, description, permissionIds } = data;

      const role = await models.role.findFirst({ where: { id, deleted: false } });
      if (!role) return this.res.status(404).json({ success: false, message: "Không tìm thấy vai trò" });

      if (role.isReadOnly) {
        return this.res.status(400).json({ success: false, message: "Không thể chỉnh sửa vai trò hệ thống (Read-only)" });
      }

      const updateData: Prisma.RoleUpdateInput = {};
      if (code !== undefined) updateData.code = code;
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      
      if (Object.keys(updateData).length) {
        await models.role.update({ where: { id }, data: updateData });
      }

      if (hasPermissionIds) {
        const permissionIdsArr = Array.isArray(permissionIds) ? permissionIds : (permissionIds ? [permissionIds] : []);
        await models.roleToPermission.deleteMany({ where: { roleId: id } });
        for (const permissionId of permissionIdsArr) {
          await models.roleToPermission.create({
            data: { roleId: id, permissionId },
          });
        }
      }

      return this.res.json({ success: true, message: "Cập nhật vai trò thành công" });
    } catch (error: any) {
      return this.res.status(500).json({ success: false, message: error.message });
    }
  }

  // 5. XÓA VAI TRÒ
  async destroy() {
    try {
      const id = this.req.params.id;
      const role = await models.role.findFirst({ where: { id, deleted: false } });
      
      if (!role) return this.res.status(404).json({ success: false, message: "Không tìm thấy vai trò" });
      if (role.isReadOnly) {
        return this.res.status(400).json({ success: false, message: "Không thể xóa vai trò hệ thống (Read-only)" });
      }

      await models.role.update({
        where: { id },
        data: { deleted: true },
      });

      return this.res.json({ success: true, message: "Xóa vai trò thành công" });
    } catch (error: any) {
      return this.res.status(500).json({ success: false, message: error.message });
    }
  }

  // 6. GÁN NGƯỜI DÙNG VÀO VAI TRÒ
  async assignUser() {
    try {
      const roleId = this.req.params.id;
      const userIds = Array.isArray(this.req.body.userIds) ? this.req.body.userIds : (this.req.body.userIds ? [this.req.body.userIds] : []);
      
      if (userIds.length === 0) {
        return this.res.status(400).json({ success: false, message: "Vui lòng chọn ít nhất một người dùng" });
      }

      const role = await models.role.findFirst({ where: { id: roleId, deleted: false } });
      if (!role) return this.res.status(404).json({ success: false, message: "Không tìm thấy vai trò" });

      for (const userId of userIds) {
        await models.userToRole.upsert({
          where: { userId_roleId: { userId, roleId } },
          create: { userId, roleId },
          update: {},
        });
      }

      return this.res.json({ success: true, message: `Đã gán ${userIds.length} người dùng vào vai trò` });
    } catch (error: any) {
      return this.res.status(500).json({ success: false, message: error.message });
    }
  }

  // 7. GỠ NGƯỜI DÙNG KHỎI VAI TRÒ
  async unassignUser() {
    try {
      const { id: roleId, userId } = this.req.params;
      await models.userToRole.deleteMany({
        where: { userId, roleId },
      });
      return this.res.json({ success: true, message: "Đã gỡ quyền người dùng thành công" });
    } catch (error: any) {
      return this.res.status(500).json({ success: false, message: error.message });
    }
  }

  // 8. DATA DÀNH CHO MODAL GÁN QUYỀN (Nếu frontend gọi lấy danh sách user chưa có role)
  async assignUsersJson() {
    const roleId = this.req.params.id;
    const role = await models.role.findFirst({ where: { id: roleId, deleted: false } });
    if (!role) return this.res.status(404).json({ success: false, message: "Không tìm thấy vai trò" });

    const usersInRole = await models.userToRole.findMany({
      where: { roleId },
      select: { userId: true },
    });
    const userIdsInRole = usersInRole.map((ur: { userId: string }) => ur.userId);

    const search = String(this.req.query.search || "").trim();
    const where: Prisma.UserWhereInput = {
      deleted: false,
      id: { notIn: userIdsInRole },
    };
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const usersToAssign = await models.user.findMany({
      where,
      orderBy: { email: "asc" },
      take: 50,
    });

    return this.res.json({ usersToAssign, role: { id: role.id, name: role.name } });
  }

  // CÁC HÀM CŨ CỦA PUG KHÔNG CẦN THIẾT CHO REACT -> Đã được loại bỏ (new, edit, assignPage)
}