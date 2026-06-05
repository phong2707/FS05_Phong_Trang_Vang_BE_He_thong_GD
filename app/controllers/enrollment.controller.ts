import { Request, Response } from "express";
import { ApplicationController } from "./application.controller";
import { EnrollmentService } from "@services/enrollment.service";
import { PaymentService } from "@services/payment.service";
import models from "@models";

/**
 * EnrollmentController - Dành cho Sinh viên
 * Xử lý đăng ký khóa học, thanh toán, callback VNPay
 */
export class EnrollmentController extends ApplicationController {
  /**
   * Action: Sinh viên gửi yêu cầu đăng ký khóa học
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        courseId,
        paymentMethod,
        guestEmail,
        guestFirstName,
        guestLastName,
        guestPhoneNumber,
      } = this.req.body;

      if (!courseId || !paymentMethod) {
        this.renderJson({ error: "courseId và paymentMethod là bắt buộc" }, 400);
        return;
      }

      if (!["VNPAY", "MANUAL"].includes(paymentMethod)) {
        this.renderJson({ error: "paymentMethod phải là VNPAY hoặc MANUAL" }, 400);
        return;
      }

      const userId = this.currentUser?.id ?? null;

      if (!userId && (!guestEmail || !guestFirstName || !guestLastName)) {
        this.renderJson(
          { error: "Khách chưa đăng nhập cần cung cấp guestEmail, guestFirstName, guestLastName" },
          400
        );
        return;
      }

      const result = await EnrollmentService.studentEnrollCourse(
        userId,
        courseId,
        paymentMethod as "VNPAY" | "MANUAL",
        {
          guestEmail,
          guestFirstName,
          guestLastName,
          guestPhoneNumber,
        }
      );

      this.renderJson(
        {
          message: "Đăng ký khóa học thành công",
          enrollment: result.enrollment,
          transaction: result.transaction,
          ...(result.vnpayUrl ? { vnpayUrl: result.vnpayUrl } : {}),
        },
        201
      );
    } catch (error: any) {
      const message = error?.message || "Lỗi trong quá trình đăng ký";

      // Nếu route/middleware ngoài vẫn ép login thì trả rõ cho FE tránh message mơ hồ
      if (message.includes("You have to login first") || message.includes("login")) {
        this.renderJson(
          {
            error: "Hệ thống đang cấu hình yêu cầu đăng nhập cho route này. Cần bỏ requireLogin ở route/middleware /api/v1/enrollments để cho phép guest.",
            raw: message,
          },
          401
        );
        return;
      }

      this.renderJson(
        {
          error: message,
        },
        500
      );
    }
  }

  /**
   * Action: VNPay Return URL callback
   * Xác thực callback từ VNPay và redirect user tới PaymentResultPage
   */
 /**
   * VNPay Return URL (callback sau khi thanh toán)
   */
  async vnpayReturn(): Promise<void> {
    try {
      // 💡 SỬ DỤNG this.req THEO CHUẨN CỦA TS-RAILS
      const vnpayParams = this.req.query as any; 
      
      const verifyResult = PaymentService.verifyVNPayReturn(vnpayParams);
      const frontendBaseUrl = process.env.FRONTEND_BASE_URL || "http://localhost:5173";

      if (!verifyResult.isValid) {
        // 💡 SỬ DỤNG this.res.redirect ĐỂ CHUYỂN TRANG
        this.res.redirect(`${frontendBaseUrl}/payment-result?success=false&message=${encodeURIComponent(verifyResult.message || "Xác thực thất bại")}`);
        return;
      }

      // 💡 SỬ DỤNG models ĐÃ IMPORT Ở ĐẦU FILE (import models from "@models")
      await models.$transaction(async (tx) => {
        const transaction = await tx.transaction.findFirst({
          where: { id: verifyResult.orderId },
          include: { enrollment: { include: { user: true } } }
        });

        if (!transaction) throw new Error("Giao dịch không tồn tại trong hệ thống");
        if (transaction.status === "SUCCESS") return; // Bỏ qua nếu IPN đã xử lý trước

        // 1. Cập nhật Transaction
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: "SUCCESS", referenceCode: verifyResult.transactionNo || "" }
        });

        // 2. Cập nhật Enrollment thành ACTIVE
        await tx.courseEnrollment.update({
          where: { id: transaction.enrollmentId },
          data: { status: "ACTIVE", completedAt: new Date() }
        });

        // 3. Kích hoạt User nếu là Guest (PENDING)
        if (transaction.enrollment?.user?.status === "PENDING") {
          await tx.user.update({
            where: { id: transaction.enrollment.userId },
            data: { status: "ACTIVE" }
          });
        }
      });

      // 💡 CHUYỂN HƯỚNG THÀNH CÔNG VỀ GIAO DIỆN FRONTEND
      this.res.redirect(`${frontendBaseUrl}/payment-result?success=true&transactionId=${verifyResult.orderId}`);
      
    } catch (error: any) {
      console.error("❌ LỖI VNPAY_RETURN:", error);
      const frontendBaseUrl = process.env.FRONTEND_BASE_URL || "http://localhost:5173";
      this.res.redirect(`${frontendBaseUrl}/payment-result?success=false&message=${encodeURIComponent("Lỗi hệ thống khi xử lý giao dịch")}`);
    }
  }

  /**
   * Action: VNPay IPN URL webhook (bất đồng bộ)
   * Xác thực và xử lý thanh toán từ VNPay webhook
   */
  async vnpayIpn(req: Request, res: Response): Promise<void> {
    try {
      const vnpayParams = this.req.body;
      const verifyResult = PaymentService.verifyVNPayReturn(vnpayParams);

      if (!verifyResult.isValid) {
        this.renderJson(
          {
            RespCode: "97",
            Message: "Checksum not match",
          },
          200
        );
        return;
      }

      const transaction = await this.models.transaction.findFirst({
        where: {
          id: verifyResult.orderId,
        },
      });

      if (!transaction) {
        this.renderJson(
          {
            RespCode: "01",
            Message: "Order not found",
          },
          200
        );
        return;
      }

      if (verifyResult.responseCode === "00") {
        // Update transaction to SUCCESS
        await this.models.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "SUCCESS",
            referenceCode: verifyResult.transactionNo || transaction.referenceCode,
          },
        });

        // Update enrollment to ACTIVE
        await EnrollmentService.updateEnrollmentStatus(transaction.enrollmentId, "ACTIVE");

        // Update user status if needed
        const enrollment = await this.models.courseEnrollment.findUnique({
          where: { id: transaction.enrollmentId },
          include: { user: true },
        });

        if (enrollment?.user?.status === "PENDING") {
          await this.models.user.update({
            where: { id: enrollment.userId },
            data: { status: "ACTIVE" },
          });
        }

        this.renderJson(
          {
            RespCode: "00",
            Message: "Confirm success",
          },
          200
        );
      } else {
        // Payment failed
        await this.models.transaction.update({
          where: { id: transaction.id },
          data: { status: "FAILED" },
        });

        this.renderJson(
          {
            RespCode: "02",
            Message: "Confirm failed",
          },
          200
        );
      }
    } catch (error: any) {
      this.renderJson(
        {
          RespCode: "99",
          Message: "System error",
        },
        200
      );
    }
  }

  /**
   * Action: Lấy chi tiết giao dịch (dùng cho PaymentResultPage)
   */
  async getTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = this.req.params;

      if (!transactionId) {
        this.renderJson({ error: "transactionId là bắt buộc" }, 400);
        return;
      }

      const transaction = await EnrollmentService.getTransactionDetails(transactionId);

      this.renderJson(
        {
          message: "Lấy chi tiết giao dịch thành công",
          transaction: {
            id: transaction.id,
            amount: transaction.amount,
            paymentMethod: transaction.paymentMethod,
            status: transaction.status,
            referenceCode: transaction.referenceCode,
            createdAt: transaction.createdAt,
            enrollmentId: transaction.enrollmentId,
            course: transaction.enrollment?.course ? {
              id: transaction.enrollment.course.id,
              title: transaction.enrollment.course.title,
            } : null,
            user: transaction.enrollment?.user ? {
              id: transaction.enrollment.user.id,
              firstName: transaction.enrollment.user.firstName,
              lastName: transaction.enrollment.user.lastName,
              email: transaction.enrollment.user.email,
            } : null,
          },
        },
        200
      );
    } catch (error: any) {
      this.renderJson(
        {
          error: error?.message || "Lỗi khi lấy chi tiết giao dịch",
        },
        500
      );
    }
  }
}
