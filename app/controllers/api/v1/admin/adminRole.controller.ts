import models from "@models";
import { NotFoundError } from "ts-rails";
import { ApiV1Controller } from "..";

export class ApiV1AdminRoleController extends ApiV1Controller {
  async index() {
    const roles = await models.role.findMany({
      where: { deleted: false },
      include: {
        permissions: {
          include: {
            permission: { include: { feature: true } },
          },
        },
      },
    });
    this.renderJson(roles);
  }

  async show() {
    const role = await models.role.findFirst({
      where: { id: this.req.params.id, deleted: false },
      include: {
        permissions: {
          include: {
            permission: { include: { feature: true } },
          },
        },
      },
    });
    if (!role) throw new NotFoundError("Role not found");
    this.renderJson(role);
  }

  async create() {
    try {
      const { code, name, description, permissionIds } = this.req.body;
      const role = await models.role.create({
        data: { code, name, description }
      });

      if (permissionIds && Array.isArray(permissionIds)) {
        for (const permissionId of permissionIds) {
          await models.roleToPermission.create({
            data: { roleId: role.id, permissionId }
          });
        }
      }

      // Fetch the complete role with all related data
      const completeRole = await models.role.findFirst({
        where: { id: role.id, deleted: false },
        include: {
          permissions: {
            include: {
              permission: { include: { feature: true } }
            }
          }
        }
      });

      this.renderJson({ success: true, data: completeRole });
    } catch (error: any) {
      this.renderJson({ success: false, message: error.message }, 400);
    }
  }

  async update() {
    try {
      const { id } = this.req.params;
      const { code, name, description, permissionIds } = this.req.body;

      const role = await models.role.findFirst({
        where: { id, deleted: false }
      });
      if (!role) throw new NotFoundError("Role not found");

      await models.role.update({
        where: { id },
        data: { code, name, description }
      });

      if (permissionIds && Array.isArray(permissionIds)) {
        await models.roleToPermission.deleteMany({ where: { roleId: id } });
        for (const permissionId of permissionIds) {
          await models.roleToPermission.create({
            data: { roleId: id, permissionId }
          });
        }
      }

      // Fetch the complete role with all related data
      const updatedRole = await models.role.findFirst({
        where: { id, deleted: false },
        include: {
          permissions: {
            include: {
              permission: { include: { feature: true } }
            }
          }
        }
      });

      this.renderJson({ success: true, data: updatedRole });
    } catch (error: any) {
      this.renderJson({ success: false, message: error.message }, 400);
    }
  }

  async destroy() {
    try {
      const { id } = this.req.params;
      const role = await models.role.findFirst({
        where: { id, deleted: false }
      });
      if (!role) throw new NotFoundError("Role not found");

      await models.role.update({
        where: { id },
        data: { deleted: true }
      });

      this.renderJson({ success: true, message: "Deleted successfully" });
    } catch (error: any) {
      this.renderJson({ success: false, message: error.message }, 400);
    }
  }
}
