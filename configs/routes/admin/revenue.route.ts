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
        setPermissionForAny: ["REVENUE_VIEW", "ADMIN_MANAGE"],
      }
    );

    // Lấy thống kê tổng quát
    this.get(
      "/overview",
      action(RevenueController, "getOverview"),
      {
        setPermissionForAny: ["REVENUE_VIEW", "ADMIN_MANAGE"],
      }
    );

    // Lấy danh sách giao dịch gần đây
    this.get(
      "/transactions",
      action(RevenueController, "getTransactions"),
      {
        setPermissionForAny: ["REVENUE_VIEW", "ADMIN_MANAGE"],
      }
    );

    // Lấy top khóa học có doanh thu cao nhất
    this.get(
      "/top-courses",
      action(RevenueController, "getTopCourses"),
      {
        setPermissionForAny: ["REVENUE_VIEW", "ADMIN_MANAGE"],
      }
    );

    // Lấy doanh thu theo khoảng thời gian
    this.get(
      "/by-date-range",
      action(RevenueController, "getRevenueByDateRange"),
      {
        setPermissionForAny: ["REVENUE_VIEW", "ADMIN_MANAGE"],
      }
    );
  }
}
