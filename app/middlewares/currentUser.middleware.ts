import { verifyToken } from "@lib";
import models from "@models";
import { NextFunction, Request, Response } from "express";
import { ApplicationMiddleware } from "./application.middleware";

export class CurrentUserMiddleware extends ApplicationMiddleware {
  public async execute(req: Request, res: Response, next: NextFunction) {
    try {
      let userId: string | undefined;

      // 1) Ưu tiên đọc JWT từ header Authorization
      const authHeader = req.headers.authorization as string | undefined;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
          const decoded = verifyToken(token) as any;
          userId = decoded?.id;
        } catch {
          console.warn("[AUTH] Token không hợp lệ hoặc hết hạn");
        }
      }

      // 2) Fallback session userId (web-view / server-rendered)
      if (!userId && (req as any).session?.userId) {
        userId = (req as any).session.userId;
      }

      if (userId) {
        const user = await models.user.findUnique({
          where: { id: userId, deleted: false },
          include: {
            roles: { include: { role: true } },
            permissions: { include: { permission: true } },
          },
        });

        if (user && user.status === "ACTIVE") {
          req.user = user as any;
          res.locals.currentUser = user;

          const userPermissions =
            user.permissions?.map((p: any) => p.permission.code) || [];
          const userRoles = user.roles?.map((ur: any) => ur.role?.code) || [];

          (res.locals as any).isAdmin = userRoles.includes("ADMIN");
          (res.locals as any).permissions = userPermissions;
        } else {
          req.user = null;
        }
      } else {
        req.user = null;
      }

      next();
    } catch (error) {
      console.error("[CRITICAL] CurrentUserMiddleware Error:", error);
      req.user = null;
      next();
    }
  }
}
