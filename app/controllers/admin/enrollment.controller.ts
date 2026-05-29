import { Request, Response, NextFunction } from "express";
import { ApplicationController } from "../application.controller";
import { EnrollmentService } from "@services/enrollment.service";

/**
 * Admin/EnrollmentController - Dành cho Admin
 * Xử lý duyệt/từ chối đơn đăng ký khóa học
 */
export class AdminEnrollmentController extends ApplicationController {
  /**
   * Middleware: Kiểm tra quyền Admin
   */
  protected requireAdminPermission(req: Request, res: Response, next: NextFunction): void {
    const currentUser = this.currentUser;
    const isAdmin = currentUser?.permissions?.includes("admin:approve-enrollments");

    if (!isAdmin) {
      this.renderJson({ error: "Bạn không có quyền truy cập" }, 403);
      return;
    }

    next();
  }

  /**
   * Action: Lấy danh sách đơn đăng ký chờ duyệt (status = PENDING)
   */
  async index(req: Request, res: Response): Promise<void> {
    try {
      const { status = "PENDING", limit = 20, page = 1 } = req.query;

      const limitNum = Math.min(Number(limit), 100);
      const pageNum = Math.max(Number(page), 1);
      const offset = (pageNum - 1) * limitNum;

      const [enrollments, total] = await Promise.all([
        this.models.courseEnrollment.findMany({
          where: { status: String(status) },
          include: {
            user: true,
            course: true,
            transaction: true,
          },
          orderBy: { enrolledAt: "desc" },
          skip: offset,
          take: limitNum,
        }),
        this.models.courseEnrollment.count({
          where: { status: String(status) },
        }),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      this.renderJson(
        {
          message: "Danh sách đơn đăng ký",
          enrollments: enrollments.map((e) => ({
            id: e.id,
            userId: e.userId,
            courseId: e.courseId,
            status: e.status,
            progress: e.progress,
            enrolledAt: e.enrolledAt,
            completedAt: e.completedAt,
            user: {
              id: e.user.id,
              firstName: e.user.firstName,
              lastName: e.user.lastName,
              email: e.user.email,
              status: e.user.status,
              phoneNumber: e.user.phoneNumber,
            },
            course: {
              id: e.course.id,
              title: e.course.title,
              price: e.course.price,
              discountPrice: e.course.discountPrice,
            },
            transaction: e.transaction
              ? {
                  id: e.transaction.id,
                  amount: e.transaction.amount,
                  paymentMethod: e.transaction.paymentMethod,
                  status: e.transaction.status,
                  referenceCode: e.transaction.referenceCode,
                  createdAt: e.transaction.createdAt,
                }
              : null,
          })),
          pagination: {
            limit: limitNum,
            page: pageNum,
            total,
            totalPages,
          },
        },
        200
      );
    } catch (error: any) {
      this.renderJson(
        {
          error: "Lỗi khi lấy danh sách đơn đăng ký",
          message: error.message,
        },
        500
      );
    }
  }

  /**
   * Action: Admin duyệt đơn đăng ký
   */
  async approve(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.renderJson({ error: "Enrollment ID là bắt buộc" }, 400);
        return;
      }

      const adminId = this.currentUser?.id;
      if (!adminId) {
        this.renderJson({ error: "Admin không được xác thực" }, 401);
        return;
      }

      const result = await EnrollmentService.adminApproveEnrollment(id, adminId);

      this.renderJson(
        {
          message: "Duyệt đơn đăng ký thành công",
          enrollment: {
            id: result.id,
            userId: result.userId,
            courseId: result.courseId,
            status: result.status,
            progress: result.progress,
            enrolledAt: result.enrolledAt,
            completedAt: result.completedAt,
          },
          user: result.user
            ? {
                id: result.user.id,
                status: result.user.status,
                email: result.user.email,
                firstName: result.user.firstName,
                lastName: result.user.lastName,
              }
            : null,
        },
        200
      );
    } catch (error: any) {
      this.renderJson(
        {
          error: "Lỗi khi duyệt đơn đăng ký",
          message: error.message,
        },
        500
      );
    }
  }

  /**
   * Action: Admin từ chối đơn đăng ký
   */
  async reject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason = "" } = req.body;

      if (!id) {
        this.renderJson({ error: "Enrollment ID là bắt buộc" }, 400);
        return;
      }

      const enrollment = await this.models.courseEnrollment.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      this.renderJson(
        {
          message: "Từ chối đơn đăng ký thành công",
          reason,
          enrollment: {
            id: enrollment.id,
            userId: enrollment.userId,
            courseId: enrollment.courseId,
            status: enrollment.status,
          },
        },
        200
      );
    } catch (error: any) {
      this.renderJson(
        {
          error: "Lỗi khi từ chối đơn đăng ký",
          message: error.message,
        },
        500
      );
    }
  }

  /**
   * Action: Lấy chi tiết 1 đơn đăng ký
   */
  async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.renderJson({ error: "Enrollment ID là bắt buộc" }, 400);
        return;
      }

      const enrollment = await this.models.courseEnrollment.findUnique({
        where: { id },
        include: {
          user: true,
          course: true,
          transaction: true,
        },
      });

      if (!enrollment) {
        this.renderJson({ error: "Đơn đăng ký không tồn tại" }, 404);
        return;
      }

      this.renderJson({ enrollment }, 200);
    } catch (error: any) {
      this.renderJson(
        {
          error: "Lỗi khi lấy chi tiết đơn đăng ký",
          message: error.message,
        },
        500
      );
    }
  }
}
