import { FlashType } from "@configs/enum";
import { NextFunction, Request, Response } from "express";
import { ApplicationMiddleware } from "./application.middleware";

export class ValidateUserLoginMiddleware extends ApplicationMiddleware {
  constructor() {
    super();
  }

  public async execute(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      // === GẮN CAMERA THEO DÕI LOGIC BACKEND ===
    console.log("\n--- BẮT ĐẦU KIỂM TRA PHÂN QUYỀN ---");
    console.log("1. Đầu vào req.user:", req.user ? `CÓ (${(req.user as any).email})` : "KHÔNG CÓ (NULL)");
    console.log("2. Header Token:", req.headers.authorization ? "ĐÃ GỬI LÊN" : "TRỐNG");
    // ==========================================

    const isApiRequest = req.originalUrl.includes("/api") || req.headers["accept"]?.includes("application/json") || req.xhr;
      const t = (res.locals?.t as (k: string) => string) || ((k: string) => k);
      if (isApiRequest) {
        return res
          .status(403)
          .json({ success: false, error: t("flash.login_first") });
      } else {
        req.flash(FlashType.Errors, { msg: t("flash.login_first") });
        return res.redirect("/auth");
      }
    }

    next();
  }
}
