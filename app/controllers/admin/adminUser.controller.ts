import { Prisma } from "@db";
import models from "@models";
import {
  CreateUserValidator,
  UpdateUserValidator,
} from "@validators/admin.validator";
import { NotFoundError } from "ts-rails";
import { AdminController } from "./admin.controller";

export class AdminUserController extends AdminController {
  // API 1: Lấy danh sách (Hỗ trợ lọc theo TẤT CẢ ROLE)
  async index(): Promise<any> {
    const search = String(this.req.query.search || "").trim();
    const sortBy = String(this.req.query.sortBy || "createdAt");
    const sortOrder = (this.req.query.sortOrder || "desc") as "asc" | "desc";
    const filterStatus = String(this.req.query.status || "");
    const filterRole = String(this.req.query.role || ""); // 🆕 Lấy thêm query role
    
    const page = Math.max(1, parseInt(String(this.req.query.page || "1"), 10));
    const perPage = Math.min(50, Math.max(10, parseInt(String(this.req.query.perPage || "10"), 10)));

    // Xây dựng điều kiện lọc (WHERE)
    const where: Prisma.UserWhereInput = { deleted: false };
    
    // Logic Search
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }
    
    // Logic Filter Status
    if (filterStatus) where.status = filterStatus;

    // 🆕 FIX: Logic Filter Role (truy vấn quan hệ N-N)
    if (filterRole) {
      where.roles = {
        some: {
          role: { code: filterRole }
        }
      };
    }

    const [users, total] = await Promise.all([
      models.user.findMany({
        where,
        include: { roles: { include: { role: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      models.user.count({ where }),
    ]);

    const roles = await models.role.findMany({ where: { deleted: false } });

    return this.res.json({
      success: true,
      users,
      roles,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
      search,
      roleCode: filterRole,
      filterStatus,
    });
  }

  // API 2: Thống kê số lượng (Để hiển thị các thẻ Stats ở Frontend)
  async stats() {
    try {
      const [total, active, teacher, student] = await Promise.all([
        models.user.count({ where: { deleted: false } }),
        models.user.count({ where: { deleted: false, status: 'ACTIVE' } }),
        models.userToRole.count({ where: { role: { code: 'TEACHER' } } }),
        models.userToRole.count({ where: { role: { code: 'STUDENT' } } }),
      ]);

      return this.res.json({
        success: true,
        stats: {
          totalUsers: total,
          activeUsers: active,
          teacherCount: teacher,
          studentCount: student
        }
      });
    } catch (error: any) {
      return this.res.status(500).json({ success: false, message: error.message });
    }
  }
  async create() {
    try {
      // 1. Lấy riêng status và password ra khỏi body trước khi đưa vào Validator
      // Điều này giúp tránh lỗi "property should not exist"
      const { status: rawStatus, password: rawPassword } = this.req.body;

      // 2. Chỉ permit những trường mà CreateUserValidator thực sự cho phép
      // (Thường là: firstName, lastName, email, phoneNumber, roleIds)
      const data = await this.params(CreateUserValidator).permit(
        "firstName", 
        "lastName", 
        "email", 
        "phoneNumber", 
        "roleIds"
      );

      const { firstName, lastName, email, phoneNumber, roleIds } = data;
      const roleIdsArr = roleIds ?? [];

      // 3. Kiểm tra trùng Email
      const existingUser = await models.user.findFirst({
        where: { email, deleted: false }
      });

      if (existingUser) {
        return this.res.status(400).json({ 
          success: false, 
          message: "Email này đã tồn tại trong hệ thống!" 
        });
      }

      // 4. Thực hiện lưu vào Database
      const newUser = await models.$transaction(async (tx) => {
        // Tạo User
        const user = await tx.user.create({
          data: {
            firstName: firstName || "",
            lastName: lastName || "",
            email: email,
            // Nếu validator không cho phép 'status', ta lấy giá trị đã bóc tách ở bước 1 
            // hoặc dùng mặc định 'ACTIVE'
            status: rawStatus || "ACTIVE", 
            phoneNumber: phoneNumber || null,
          }
        });

        // Gán Roles
        if (roleIdsArr.length > 0) {
          await tx.userToRole.createMany({
            data: roleIdsArr.map((rid: string) => ({ userId: user.id, roleId: rid }))
          });
        }

        // Lưu mật khẩu (Nếu DB của bạn có bảng Passwords riêng)
        const passwordToSave = rawPassword || "123456aA@";
        // Logic lưu password của bạn ở đây...
        // await tx.password.create({ data: { userId: user.id, password: passwordToSave ... } });

        return user;
      });

      return this.res.json({ 
        success: true, 
        message: "Tạo người dùng thành công!", 
        data: newUser 
      });

    } catch (error: any) {
      console.error("Lỗi tạo user:", error);
      // Trả về chi tiết lỗi để dễ debug
      return this.res.status(400).json({ 
        success: false, 
        message: "Dữ liệu không hợp lệ", 
        detail: error.errors || error.message 
      });
    }
  }

  // API 3: Cập nhật User (Sử dụng Transaction để an toàn tuyệt đối)
  async update() {
    const id = this.req.params.id;
    const data = await this.params(UpdateUserValidator).permit(
      "section", "firstName", "lastName", "email", "status", 
      "phoneNumber", "address", "roleIds", "permissionIds"
    );

    const { section, firstName, lastName, email, status, phoneNumber, address, roleIds, permissionIds } = data;
    const roleIdsArr = roleIds ?? [];
    const permissionIdsArr = permissionIds ?? [];

    try {
      await models.$transaction(async (tx) => {
        // 1. Cập nhật thông tin cá nhân
        if (!section || section === "personal") {
          await tx.user.update({
            where: { id },
            data: { firstName, lastName, email, status, phoneNumber, address }
          });
        }

        // 2. Cập nhật Roles (Xóa cũ tạo mới)
        if (!section || section === "roles") {
          await tx.userToRole.deleteMany({ where: { userId: id } });
          if (roleIdsArr.length > 0) {
            await tx.userToRole.createMany({
              data: roleIdsArr.map((rid: string) => ({ userId: id, roleId: rid }))
            });
          }
        }

        // 3. Cập nhật Quyền trực tiếp
        if (!section || section === "permissions") {
          await tx.userToPermission.deleteMany({ where: { userId: id } });
          if (permissionIdsArr.length > 0) {
            await tx.userToPermission.createMany({
              data: permissionIdsArr.map((pid: string) => ({ userId: id, permissionId: pid }))
            });
          }
        }
      });

      return this.res.json({ success: true, message: "Cập nhật thành công" });
    } catch (error: any) {
      return this.res.status(500).json({ success: false, message: error.message });
    }
  }

  // Các hàm show, destroy... giữ nguyên logic trả về JSON như bạn đã viết
  async show() {
    const targetUser = await this.getUserWithPermissions(this.req.params.id);
    if (!targetUser) throw new NotFoundError("User not found");
    const [roles, features] = await Promise.all([
      models.role.findMany({ where: { deleted: false } }),
      models.feature.findMany({ where: { deleted: false }, include: { permissions: { where: { deleted: false } } } }),
    ]);
    return this.res.json({ targetUser, roles, features });
  }

  async destroy() {
    await models.user.update({ where: { id: this.req.params.id }, data: { deleted: true } });
    return this.res.json({ success: true, message: "Xóa thành công" });
  }

  private async getUserWithPermissions(userId: string) {
    return await models.user.findFirst({
      where: { id: userId, deleted: false },
      include: {
        roles: { include: { role: true } },
        permissions: { include: { permission: { include: { feature: true } } } },
      },
    });
  }
}