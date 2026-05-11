import { FlashType } from "@configs/enum";
import { NextFunction, Request, Response } from "express";
import { ApplicationMiddleware } from "./application.middleware";

export class ValidateUserLoginMiddleware extends ApplicationMiddleware {
  constructor() {
    super();
  }

  public async execute(req: Request, res: Response, next: NextFunction) {
    // === GẮN CAMERA Ở ĐÂY ĐỂ LUÔN LUÔN QUAY ĐƯỢC ===
    console.log("\n--- BẮT ĐẦU KIỂM TRA ĐĂNG NHẬP ---");
    console.log("1. Header Token:", req.headers.authorization ? "ĐÃ GỬI LÊN" : "TRỐNG");
    console.log("2. Đầu vào req.user:", req.user ? `CÓ TÀI KHOẢN: ${(req.user as any).email}` : "KHÔNG CÓ (NULL)");
    // ==========================================

    if (!req.user) {
      const isApiRequest = req.originalUrl.includes("/api") || req.headers["accept"]?.includes("application/json") || req.xhr;
      const t = (res.locals?.t as (k: string) => string) || ((k: string) => k);
      
      if (isApiRequest) {
        return res.status(403).json({ success: false, error: t("flash.login_first") });
      } else {
        req.flash(FlashType.Errors, { msg: t("flash.login_first") });
        return res.redirect("/auth");
      }
    }

    next();
  }
}