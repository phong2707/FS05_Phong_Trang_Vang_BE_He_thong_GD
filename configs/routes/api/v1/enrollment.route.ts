import { RailsRoute, action } from "ts-rails";
import { EnrollmentController } from "@controllers/enrollment.controller";

export class EnrollmentRoute extends RailsRoute {
  public draw() {
    // Sinh viên đăng ký khóa học
    // POST /api/v1/enrollments
    this.post("/", action(EnrollmentController, "create"));

    // VNPay Return URL (callback sau khi thanh toán)
    // GET /api/v1/payments/vnpay-return
    this.get("/vnpay-return", action(EnrollmentController, "vnpayReturn"));

    // VNPay IPN webhook (bất đồng bộ)
    // POST /api/v1/payments/vnpay-ipn
    this.post("/vnpay-ipn", action(EnrollmentController, "vnpayIpn"));
  }
}
