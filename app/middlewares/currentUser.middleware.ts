import { verifyToken } from "@lib";
import models from "@models";
import { NextFunction, Request, Response } from "express";
import { ApplicationMiddleware } from "./application.middleware";

export class CurrentUserMiddleware extends ApplicationMiddleware {
  public async execute(req: Request, res: Response, next: NextFunction) {
    try {
      let userId: string | undefined;

      // 1. ƯU TIÊN KIỂM TRA TOKEN (Dành cho API & Client)
      // Hỗ trợ cả 'Authorization' và 'authorization'
      const authHeader = (req.headers.authorization || (req.headers as any).Authorization) as string | undefined;

      // Debug tạm để truy vết lỗi thiếu token ở API grade
      if (req.path.includes("/assignments/") && req.path.includes("/grade")) {
        console.log("--- BẮT ĐẦU KIỂM TRA ĐĂNG NHẬP ---");
        console.log("1. Header Token:", authHeader ? "CÓ" : "TRỐNG");
      }

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
          const decoded = verifyToken(token) as any;
          userId = decoded?.id;
        } catch (jwtError) {
          console.warn("[AUTH] Token không hợp lệ hoặc hết hạn");
        }
      }

      // 2. NẾU KHÔNG CÓ TOKEN, KIỂM TRA SESSION (Dành cho trình duyệt/Web View)
      if (!userId && (req as any).session?.userId) {
        userId = (req as any).session.userId;
      }

      if (userId) {
        // 3. TRUY VẤN USER VỚI ĐẦY ĐỦ ROLES & PERMISSIONS
        const user = await models.user.findUnique({
          where: { id: userId, deleted: false },
          include: {
            roles: { include: { role: true } },
            permissions: { include: { permission: true } }
            }
        });

        if (user && user.status === "ACTIVE") {
          req.user = user as any;
          res.locals.currentUser = user;

          // Tính toán quyền Admin cho cả API và Web locals
          const userPermissions = user.permissions?.map((p: any) => p.permission.code) || [];
          const userRoles = user.roles?.map((ur: any) => ur.role?.code) || [];

          (res.locals as any).isAdmin = userRoles.includes('ADMIN');
          (res.locals as any).permissions = userPermissions;
      } else {
        req.user = null;
      }
      } else {
        req.user = null;
      }

      // Debug tạm để truy vết lỗi thiếu req.user ở API grade
      if (req.path.includes("/assignments/") && req.path.includes("/grade")) {
        console.log("2. Đầu vào req.user:", req.user ? "CÓ" : "KHÔNG CÓ (NULL)");
      }

      next();
    } catch (error) {
      console.error("[CRITICAL] CurrentUserMiddleware Error:", error);
      req.user = null;
      next();
  }
}
}
