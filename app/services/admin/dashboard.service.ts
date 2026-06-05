import models from "@models";

export const adminDashboardService = {
  getDashboardSummary: async () => {
    try {
      // 1. Stats
      const [totalUsers, activeCourses, totalTeachers, revenueAgg] = await Promise.all([
        models.user.count({ where: { deleted: false } }),
        models.course.count({ where: { status: "PUBLISHED" } }),
        models.user.count({ where: { roles: { some: { role: { code: "TEACHER" } } } } }),
        models.transaction.aggregate({
          _sum: { amount: true },
          where: { status: "SUCCESS" },
        }),
      ]);

      const totalRevenue = (revenueAgg._sum.amount as number) || 0;

      const stats = {
        totalUsers,
        activeCourses,
        totalTeachers,
        totalRevenue,
      };

      // 2. Recent activities: prefer latest transactions, fallback to new users
      const recentTransactions = await models.transaction.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, email: true } },
          course: { select: { id: true, title: true } },
        },
      });

      const txActivities = recentTransactions.map((tx) => ({
        action: "Transaction",
        user: tx.student ? `${tx.student.firstName || ""} ${tx.student.lastName || ""}`.trim() || tx.student.email : "Guest",
        time: tx.createdAt,
        detail: `${tx.amount}`,
        meta: {
          status: tx.status,
          courseTitle: tx.course?.title || null,
        },
      }));

      let activities: any[] = txActivities;

      if (activities.length < 5) {
        const need = 5 - activities.length;
        const newUsers = await models.user.findMany({
          where: { deleted: false },
          take: need,
          orderBy: { createdAt: "desc" },
          include: { roles: { include: { role: true } } },
        });

        const userActivities = newUsers.map((u) => ({
          action: "New User",
          user: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
          time: u.createdAt,
          detail: u.roles && u.roles.length ? u.roles.map((r: any) => r.role.code).join(", ") : "",
          meta: { userId: u.id },
        }));

        activities = activities.concat(userActivities);
      }

      // Ensure sorted by time desc and limit to 5
      activities = activities
        .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 5);

      return { stats, recentActivities: activities };
    } catch (error) {
      throw error;
    }
  },
};

export default adminDashboardService;
