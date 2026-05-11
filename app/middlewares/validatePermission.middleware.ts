import { FlashType } from "@configs/enum";
import { NextFunction, Request, Response } from "express";
import { ApplicationMiddleware } from "./application.middleware";
import models from "@models"; // BẮT BUỘC IMPORT: Gọi thẳng vào Database

export class ValidateUserPermissionMiddleware extends ApplicationMiddleware {
  private permissionCode: string;

  constructor(permissionCode: string) {
    super();
    this.permissionCode = permissionCode;
  }

  public async execute(req: Request, res: Response, next: NextFunction) {
    const isApiRequest = req.originalUrl.includes("/api") || req.headers["accept"]?.includes("application/json") || req.xhr;
    
    if (!req.user) {
      const t = (res.locals?.t as (k: string) => string) || ((k: string) => k);
      if (isApiRequest) {
        return res.status(401).json({ success: false, error: t("flash.login_first") || "Vui lòng đăng nhập" });
      } else {
        req.flash(FlashType.Errors, { msg: t("flash.login_first") });
        return res.redirect("/");
      }
    }

    try {
      // 1. Lấy tất cả Role ID mà User đang có
      const userRoles = await models.userToRole.findMany({
        where: { userId: req.user.id },
        select: { roleId: true }
      });
      const roleIds = userRoles.map(ur => ur.roleId);

      // 2. Từ Role ID, móc nối sang bảng RoleToPermission để lấy đúng mã Permission
      const rolePermissions = await models.roleToPermission.findMany({
        where: { roleId: { in: roleIds } },
        include: { permission: true }
      });
      const rolePermCodes = rolePermissions.map(rp => rp.permission.code);

      // 3. Lấy thêm Permission được gán trực tiếp cho User (Nếu có)
      const directPermissions = await models.userToPermission.findMany({
        where: { userId: req.user.id },
        include: { permission: true }
      });
      const directPermCodes = directPermissions.map(dp => dp.permission.code);

      // 4. Gộp toàn bộ lại thành 1 mảng các mã quyền (Ví dụ: ['AM::READ', 'UM::CREATE'])
      const allUserPermissions = [...new Set([...rolePermCodes, ...directPermCodes])];

      // 5. Kiểm tra quyền
      if (!allUserPermissions.includes(this.permissionCode)) {
        const t = (res.locals?.t as (k: string) => string) || ((k: string) => k);
        if (isApiRequest) {
          return res.status(403).json({ success: false, error: t("flash.no_permission") || "Bạn không có quyền truy cập tính năng này." });
        } else {
          req.flash(FlashType.Errors, { msg: t("flash.no_permission") });
          return res.redirect(req.header("Referer") || "/");
        }
      }

      next();
    } catch (error) {
      console.error("Lỗi ValidateUserPermissionMiddleware:", error);
      return res.status(500).json({ success: false, error: "Lỗi hệ thống khi kiểm tra quyền" });
    }
  }
}

/**
 * Kiểm tra user có ít nhất một trong các permission.
 * Dùng cho admin khi chấp nhận AM hoặc UM.
 */
export class ValidateAnyPermissionMiddleware extends ApplicationMiddleware {
  private permissionCodes: string[];

  constructor(permissionCodes: string[]) {
    super();
    this.permissionCodes = permissionCodes;
  }

  public async execute(req: Request, res: Response, next: NextFunction) {
    const isApiRequest = req.originalUrl.includes("/api") || req.headers["accept"]?.includes("application/json") || req.xhr;
    
    if (!req.user) {
      const t = (res.locals?.t as (k: string) => string) || ((k: string) => k);
      if (isApiRequest) {
        return res.status(401).json({ success: false, error: t("flash.login_first") || "Vui lòng đăng nhập" });
      } else {
        req.flash(FlashType.Errors, { msg: t("flash.login_first") });
        return res.redirect("/");
      }
    }

    try {
      // 1. Lấy tất cả Role ID mà User đang có
      const userRoles = await models.userToRole.findMany({
        where: { userId: req.user.id },
        select: { roleId: true }
      });
      const roleIds = userRoles.map(ur => ur.roleId);

      // 2. Từ Role ID, móc nối sang bảng RoleToPermission để lấy đúng mã Permission
      const rolePermissions = await models.roleToPermission.findMany({
        where: { roleId: { in: roleIds } },
        include: { permission: true }
      });
      const rolePermCodes = rolePermissions.map(rp => rp.permission.code);

      // 3. Lấy thêm Permission được gán trực tiếp cho User (Nếu có)
      const directPermissions = await models.userToPermission.findMany({
        where: { userId: req.user.id },
        include: { permission: true }
      });
      const directPermCodes = directPermissions.map(dp => dp.permission.code);

      // 4. Gộp toàn bộ lại thành 1 mảng các mã quyền
      const allUserPermissions = [...new Set([...rolePermCodes, ...directPermCodes])];

      console.log("👉 Route đang đòi các quyền:", this.permissionCodes);
      console.log("👉 Database báo User đang có:", allUserPermissions); // Lần này sẽ ra ['AM::READ', 'UM::READ'...]

      // 5. Kiểm tra có thỏa mãn ít nhất 1 quyền hay không
      const hasAny = this.permissionCodes.some((code) => allUserPermissions.includes(code));

      if (!hasAny) {
        const t = (res.locals?.t as (k: string) => string) || ((k: string) => k);
        if (isApiRequest) {
          return res.status(403).json({ success: false, error: t("flash.no_permission") || "Bạn không có quyền truy cập trang này." });
        } else {
          req.flash(FlashType.Errors, { msg: t("flash.no_permission") });
          return res.redirect(req.header("Referer") || "/");
        }
      }

      next();
    } catch (error) {
      console.error("Lỗi ValidateAnyPermissionMiddleware:", error);
      return res.status(500).json({ success: false, error: "Lỗi hệ thống khi kiểm tra quyền" });
    }
  }
}