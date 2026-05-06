import { Prisma } from "@db";
import models from "@models";
import {
  CreateUserValidator,
  UpdateUserValidator,
} from "@validators/admin.validator";
import { NotFoundError } from "ts-rails";
import { AdminController } from "./admin.controller";

export class AdminUserController extends AdminController {
  async index(): Promise<any> {
    const search = String(this.req.query.search || "").trim();
    const sortBy = String(this.req.query.sortBy || "createdAt");
    const sortOrder = String(this.req.query.sortOrder || "desc") as
      | "asc"
      | "desc";
    const filterStatus = String(this.req.query.filterStatus || "");
    const page = Math.max(1, parseInt(String(this.req.query.page || "1"), 10));
    const perPage = Math.min(
      50,
      Math.max(10, parseInt(String(this.req.query.perPage || "10"), 10)),
    );

    const where: Prisma.UserWhereInput = { deleted: false };
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ];
    }
    if (filterStatus) where.status = filterStatus;

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

    // Đã fix: Trả về JSON cho Frontend
    this.res.json({
      users,
      roles,
      total,
      page,
      perPage,
      search,
      sortBy,
      sortOrder,
      filterStatus,
    });
  }

  async show() {
    const targetUser = await this.getUserWithPermissions(this.req.params.id);
    if (!targetUser) throw new NotFoundError("User not found");

    const [roles, features] = await Promise.all([
      models.role.findMany({ where: { deleted: false } }),
      models.feature.findMany({
        where: { deleted: false },
        include: {
          permissions: { where: { deleted: false } },
        },
      }),
    ]);

    // Đã fix: Trả về JSON
    return this.res.json({
      targetUser,
      roles,
      features,
    });
  }

  async new() {
    const roles = await models.role.findMany({ where: { deleted: false } });
    
    // Đã fix: Trả về JSON
    return this.res.json({
      roles,
    });
  }

  async create() {
    const data = await this.params(CreateUserValidator).permit(
      "firstName",
      "lastName",
      "email",
      "roleIds",
    );
    const { firstName, lastName, email, roleIds } = data;
    const roleIdsArr = roleIds ?? [];

    const user = await models.user.create({
      data: {
        firstName: firstName || "",
        lastName: lastName || "",
        email: email || "",
        status: "PENDING",
        roles: {
          create: roleIdsArr.map((roleId: string) => ({
            role: { connect: { id: roleId } },
          })),
        },
      },
    });

    // Đã fix: Trả về JSON thay vì redirect
    return this.res.json({
      success: true,
      message: "Tạo người dùng thành công",
      user,
    });
  }

  async edit() {
    const targetUser = await this.getUserWithPermissions(this.req.params.id);
    if (!targetUser) throw new NotFoundError("User not found");

    const [roles, features] = await Promise.all([
      models.role.findMany({ where: { deleted: false } }),
      models.feature.findMany({
        where: { deleted: false },
        include: {
          permissions: { where: { deleted: false } },
        },
      }),
    ]);

    // ĐÃ FIX LỖI "search": Chỉ trả về đúng 3 biến có trong hàm này
    return this.res.json({
      targetUser,
      roles,
      features,
    });
  }

  async update() {
    const id = this.req.params.id;
    const data = await this.params(UpdateUserValidator).permit(
      "section",
      "firstName",
      "lastName",
      "email",
      "status",
      "phoneNumber",
      "address",
      "roleIds",
      "permissionIds",
    );
    const {
      section,
      firstName,
      lastName,
      email,
      status,
      phoneNumber,
      address,
      roleIds,
      permissionIds,
    } = data;

    const roleIdsArr = roleIds ?? [];
    const permissionIdsArr = permissionIds ?? [];

    if (!section || section === "personal") {
      const personalData: Prisma.UserUpdateInput = {};
      if (firstName !== undefined) personalData.firstName = firstName;
      if (lastName !== undefined) personalData.lastName = lastName;
      if (email !== undefined) personalData.email = email;
      if (status !== undefined) personalData.status = status;
      if (phoneNumber !== undefined) personalData.phoneNumber = phoneNumber;
      if (address !== undefined) personalData.address = address;
      if (Object.keys(personalData).length) {
        await models.user.update({ where: { id }, data: personalData });
      }
    }

    if (section === "roles" || !section) {
      await models.userToRole.deleteMany({ where: { userId: id } });
      for (const roleId of roleIdsArr) {
        await models.userToRole.create({
          data: { userId: id, roleId },
        });
      }
    }

    if (section === "permissions" || !section) {
      await models.userToPermission.deleteMany({ where: { userId: id } });
      for (const permissionId of permissionIdsArr) {
        await models.userToPermission.create({
          data: { userId: id, permissionId },
        });
      }
    }

    // Đã fix: Trả về JSON thay vì redirect
    return this.res.json({ 
      success: true, 
      message: "Cập nhật thông tin thành công" 
    });
  }

  async destroy() {
    const id = this.req.params.id;
    await models.user.update({
      where: { id },
      data: { deleted: true },
    });
    
    // Đã fix: Trả về JSON thay vì redirect
    return this.res.json({
      success: true,
      message: "Xóa người dùng thành công",
    });
  }

  private async getUserWithPermissions(userId: string) {
    const user = await models.user.findFirst({
      where: { id: userId, deleted: false },
      include: {
        roles: { include: { role: true } },
        permissions: {
          include: {
            permission: {
              include: { feature: true },
            },
          },
        },
      },
    });
    return user;
  }
}