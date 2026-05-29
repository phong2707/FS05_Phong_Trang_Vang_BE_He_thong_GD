import { RailsRoute, action } from "ts-rails";
import { AdminEnrollmentController } from "@controllers/admin/enrollment.controller";

export class ApiV1AdminEnrollmentRoute extends RailsRoute {
  public draw() {
    // Admin lấy danh sách đơn đăng ký chờ duyệt
    // GET /api/v1/admin/enrollments
    this.get("/", action(AdminEnrollmentController, "index"));

    // Admin lấy chi tiết 1 đơn đăng ký
    // GET /api/v1/admin/enrollments/:id
    this.get("/:id", action(AdminEnrollmentController, "show"));

    // Admin duyệt đơn đăng ký
    // POST /api/v1/admin/enrollments/:id/approve
    this.post("/:id/approve", action(AdminEnrollmentController, "approve"));

    // Admin từ chối đơn đăng ký
    // POST /api/v1/admin/enrollments/:id/reject
    this.post("/:id/reject", action(AdminEnrollmentController, "reject"));
  }
}
