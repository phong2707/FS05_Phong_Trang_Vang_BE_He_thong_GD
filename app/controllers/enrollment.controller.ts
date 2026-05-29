import { Request, Response } from "express";
import { ApplicationController } from "./application.controller";
import { EnrollmentService } from "@services/enrollment.service";
import { PaymentService } from "@services/payment.service";

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
   */
  async vnpayReturn(req: Request, res: Response): Promise<void> {
    try {
      const vnpayParams = this.req.query as any;
      const verifyResult = PaymentService.verifyVNPayReturn(vnpayParams);

      if (!verifyResult.isValid) {
        this.renderJson(
          {
            error: "Xác thực thất bại",
            message: verifyResult.message,
          },
          400
        );
        return;
      }

      const orderId = verifyResult.orderId;
      const transaction = await this.models.transaction.findFirst({
        where: {
          referenceCode: orderId,
        },
      });

      if (!transaction) {
        this.renderJson(
          {
            error: "Giao dịch không tồn tại",
          },
          404
        );
        return;
      }

      await this.models.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "SUCCESS",
          referenceCode: verifyResult.transactionNo || transaction.referenceCode,
        },
      });

      this.renderJson(
        {
          message: "Thanh toán thành công",
          orderId: verifyResult.orderId,
          amount: verifyResult.amount,
          transactionNo: verifyResult.transactionNo,
          enrollmentId: transaction.enrollmentId,
        },
        200
      );
    } catch (error: any) {
      this.renderJson(
        {
          error: "Lỗi trong quá trình xác thực",
          message: error.message,
        },
        500
      );
    }
  }

  /**
   * Action: VNPay IPN URL webhook (bất đồng bộ)
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
          referenceCode: verifyResult.orderId,
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
        await this.models.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "SUCCESS",
            referenceCode: verifyResult.transactionNo || transaction.referenceCode,
          },
        });

        this.renderJson(
          {
            RespCode: "00",
            Message: "Confirm success",
          },
          200
        );
      } else {
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
}
