import { RevenueController } from "@controllers";
import { action, RailsRoute } from "ts-rails";

/**
 * Revenue Routes
 * Các endpoint quản lý doanh thu & lịch sử giao dịch
 */
export class RevenueRoute extends RailsRoute {
  public draw() {
    // Lấy toàn bộ dữ liệu dashboard (overview + transactions + top courses)
    this.get(
      "/dashboard",
      action(RevenueController, "getDashboard"),
      {
        setPermissionForAny: ["AM::READ"], // 🟢 Đã đổi thành AM::READ
      }
    );

    // Lấy thống kê tổng quát
    this.get(
      "/overview",
      action(RevenueController, "getOverview"),
      {
        setPermissionForAny: ["AM::READ"], // 🟢 Đã đổi thành AM::READ
      }
    );

    // Lấy danh sách giao dịch gần đây
    this.get(
      "/transactions",
      action(RevenueController, "getTransactions"),
      {
        setPermissionForAny: ["AM::READ"], // 🟢 Đã đổi thành AM::READ
      }
    );

    // Lấy top khóa học có doanh thu cao nhất
    this.get(
      "/top-courses",
      action(RevenueController, "getTopCourses"),
      {
        setPermissionForAny: ["AM::READ"], // 🟢 Đã đổi thành AM::READ
      }
    );

    // Lấy doanh thu theo khoảng thời gian
    this.get(
      "/by-date-range",
      action(RevenueController, "getRevenueByDateRange"),
      {
        setPermissionForAny: ["AM::READ"], // 🟢 Đã đổi thành AM::READ
      }
    );
  }
}