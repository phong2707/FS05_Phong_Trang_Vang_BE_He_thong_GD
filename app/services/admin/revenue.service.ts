import models from "@models";

/**
 * Revenue Service - Quản lý doanh thu & lịch sử giao dịch
 * Tính toán doanh thu ON-THE-FLY từ bảng Transaction
 */
export const revenueService = {
  /**
   * 1️⃣ Lấy thống kê tổng quát doanh thu
   */
  getOverviewStats: async () => {
    try {
      const transactions = await models.transaction.findMany({
        select: {
          amount: true,
          status: true,
        },
      });

      const stats = transactions.reduce(
        (acc, tx) => {
          if (tx.status === "SUCCESS") {
            acc.totalRevenue += tx.amount;
            acc.successCount += 1;
          } else if (tx.status === "PENDING") {
            acc.pendingCount += 1;
          } else if (tx.status === "FAILED") {
            acc.failedCount += 1;
          }
          return acc;
        },
        {
          totalRevenue: 0,
          successCount: 0,
          pendingCount: 0,
          failedCount: 0,
        }
      );

      return {
        totalRevenue: Math.round(stats.totalRevenue * 100) / 100,
        successTransactions: stats.successCount,
        pendingTransactions: stats.pendingCount,
        failedTransactions: stats.failedCount,
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * 2️⃣ Lấy danh sách giao dịch mới nhất
   */
  getRecentTransactions: async (limit: number = 10, status?: string) => {
    try {
      const transactions = await models.transaction.findMany({
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        // 💡 FIX 1: Thêm include để lấy thông tin Khóa học và Học viên
        include: {
          course: {
            select: {
              id: true,
              title: true, // 💡 FIX 2: Đổi name thành title
              price: true,
            }
          },
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
      });

      return transactions.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        status: tx.status,
        paymentMethod: tx.paymentMethod,
        referenceCode: tx.referenceCode,
        createdAt: tx.createdAt,
        // 💡 FIX 3: Gọi đúng trường title
        courseName: tx.course?.title || "N/A", 
        coursePrice: tx.course?.price || 0,
        studentName: `${tx.student?.firstName || ""} ${tx.student?.lastName || ""}`.trim(),
        studentEmail: tx.student?.email || "N/A",
      }));
    } catch (error) {
      throw error;
    }
  },

  /**
   * 3️⃣ Top 5 khóa học mang lại doanh thu cao nhất
   */
  getTopCourses: async (limit: number = 5) => {
    try {
      const transactions = await models.transaction.findMany({
        where: { status: "SUCCESS" },
        include: {
          course: {
            select: {
              id: true,
              title: true, // Đổi name thành title
              price: true,
              description: true,
              createdAt: true,
            }
          }
        }
      });

      const courseStats = new Map();

      transactions.forEach((tx) => {
        if (!tx.courseId) return;

        if (courseStats.has(tx.courseId)) {
          const stat = courseStats.get(tx.courseId);
          stat.totalRevenue += tx.amount;
          stat.salesCount += 1;
        } else {
          courseStats.set(tx.courseId, {
            courseId: tx.courseId,
            courseName: tx.course?.title || "Unknown", 
            price: tx.course?.price || 0,
            description: tx.course?.description || "",
            createdAt: tx.course?.createdAt || new Date(),
            totalRevenue: tx.amount,
            salesCount: 1,
          });
        }
      });

      const topCourses = Array.from(courseStats.values())
        .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit);

      return topCourses;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 4️⃣ Lấy doanh thu theo khoảng thời gian
   */
  getRevenueByDateRange: async (startDate: Date, endDate: Date) => {
    try {
      const transactions = await models.transaction.findMany({
        where: {
          status: "SUCCESS",
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          course: {
            select: {
              id: true,
              title: true, // Đổi name thành title
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);

      return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        transactionCount: transactions.length,
        transactions: transactions.map((tx) => ({
          id: tx.id,
          courseName: tx.course?.title || "N/A",
          amount: tx.amount,
          createdAt: tx.createdAt,
        })),
      };
    } catch (error) {
      throw error;
    }
  }
};