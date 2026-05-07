import { FlashType } from "@configs/enum";
import { User } from "@db";
import { NextFunction, Request, Response } from "express";
import { ApplicationMiddleware } from "./application.middleware";

export class ValidateUserPermissionMiddleware extends ApplicationMiddleware {
  private permissionCode: string;

  constructor(permissionCode: string) {
    super();
    this.permissionCode = permissionCode;
  }

  public async execute(req: Request, res: Response, next: NextFunction) {
    // 1. Nhận diện gọi API từ React
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

    // 2. CHÌA KHÓA Ở ĐÂY: Bắt buộc truy vấn lại DB để lấy full mảng quyền và tính năng
    const userWithPerms = await this.getUserById(req.user.id, true);
    const userPerms = userWithPerms?.permissions || [];
    const userFeats = userWithPerms?.features || [];

    // 3. Kiểm tra xem Mã yêu cầu có nằm trong mảng quyền HOẶC mảng tính năng không
    if (!userPerms.includes(this.permissionCode) && !userFeats.includes(this.permissionCode)) {
      const t = (res.locals?.t as (k: string) => string) || ((k: string) => k);
      if (isApiRequest) {
        return res.status(403).json({ success: false, error: t("flash.no_permission") || "Bạn không có quyền truy cập tính năng này." });
      } else {
        req.flash(FlashType.Errors, { msg: t("flash.no_permission") });
        return res.redirect(req.header("Referer") || "/");
      }
    }

    next();
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

    // Lấy full quyền từ DB
    const userWithPerms = await this.getUserById(req.user.id, true);
    const userPerms = userWithPerms?.permissions || [];
    const userFeats = userWithPerms?.features || [];

    console.log("👉 Route đang đòi các quyền:", this.permissionCodes);
    console.log("👉 Database báo User đang có:", userFeats);

    // CHÌA KHÓA LÀ ĐÂY: Kiểm tra cả 2 mảng userPerms và userFeats
    const hasAny = this.permissionCodes.some((code) =>
      userPerms.includes(code) || userFeats.includes(code)
    );

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
  }
}