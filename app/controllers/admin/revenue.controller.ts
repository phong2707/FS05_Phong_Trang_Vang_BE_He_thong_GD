import { Request, Response } from "express";
import { AdminController } from "./admin.controller";
import { revenueService } from "@services/admin/revenue.service";

/**
 * Admin Revenue Controller
 * Quản lý API doanh thu & lịch sử giao dịch
 */
export class RevenueController extends AdminController {
  /**
   * 📊 GET /admin/revenue/overview
   * Lấy thống kê tổng quát doanh thu
   */
  async getOverview() {
    try {
      const stats = await revenueService.getOverviewStats();
      return this.res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return this.res.status(500).json({
        success: false,
        message: error.message || "Lỗi khi lấy thống kê doanh thu",
      });
    }
  }

  /**
   * 📋 GET /admin/revenue/transactions
   * Lấy danh sách giao dịch gần đây
   * Query params:
   *   - limit: số lượng (mặc định 10)
   *   - status: lọc theo status (SUCCESS, PENDING, FAILED)
   */
  async getTransactions() {
    try {
      const limit = Math.min(
        parseInt(this.req.query.limit as string) || 10,
        100
      );
      const status = (this.req.query.status as string) || undefined;

      const transactions = await revenueService.getRecentTransactions(
        limit,
        status
      );

      return this.res.json({
        success: true,
        data: transactions,
        total: transactions.length,
      });
    } catch (error: any) {
      return this.res.status(500).json({
        success: false,
        message: error.message || "Lỗi khi lấy danh sách giao dịch",
      });
    }
  }

  /**
   * 🏆 GET /admin/revenue/top-courses
   * Lấy top khóa học mang lại doanh thu cao nhất
   * Query params:
   *   - limit: số lượng top (mặc định 5)
   */
  async getTopCourses() {
    try {
      const limit = Math.min(
        parseInt(this.req.query.limit as string) || 5,
        20
      );

      const topCourses = await revenueService.getTopCourses(limit);

      return this.res.json({
        success: true,
        data: topCourses,
        total: topCourses.length,
      });
    } catch (error: any) {
      return this.res.status(500).json({
        success: false,
        message:
          error.message || "Lỗi khi lấy danh sách top khóa học",
      });
    }
  }

  /**
   * 📈 GET /admin/revenue/dashboard
   * Lấy toàn bộ dữ liệu dashboard (tập hợp overview + transactions + top courses)
   */
  async getDashboard() {
    try {
      const [overview, recentTransactions, topCourses] = await Promise.all([
        revenueService.getOverviewStats(),
        revenueService.getRecentTransactions(10), // 10 giao dịch gần đây
        revenueService.getTopCourses(5), // top 5 courses
      ]);

      return this.res.json({
        success: true,
        data: {
          overview,
          recentTransactions,
          topCourses,
        },
      });
    } catch (error: any) {
      return this.res.status(500).json({
        success: false,
        message:
          error.message ||
          "Lỗi khi lấy dữ liệu dashboard doanh thu",
      });
    }
  }

  /**
   * 📅 GET /admin/revenue/by-date-range
   * Lấy doanh thu theo khoảng thời gian
   * Query params:
   *   - startDate: YYYY-MM-DD
   *   - endDate: YYYY-MM-DD
   */
  async getRevenueByDateRange() {
    try {
      const startDateStr = this.req.query.startDate as string;
      const endDateStr = this.req.query.endDate as string;

      if (!startDateStr || !endDateStr) {
        return this.res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp startDate và endDate (format: YYYY-MM-DD)",
        });
      }

      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return this.res.status(400).json({
          success: false,
          message: "Định dạng ngày không hợp lệ (dùng YYYY-MM-DD)",
        });
      }

      // Set endDate to end of day
      endDate.setHours(23, 59, 59, 999);

      const revenueData = await revenueService.getRevenueByDateRange(
        startDate,
        endDate
      );

      return this.res.json({
        success: true,
        data: revenueData,
      });
    } catch (error: any) {
      return this.res.status(500).json({
        success: false,
        message:
          error.message ||
          "Lỗi khi lấy doanh thu theo khoảng thời gian",
      });
    }
  }
}
