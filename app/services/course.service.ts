import models from "@models"; // Import Prisma client theo chuẩn dự án của bạn

export class CourseService {
  static async getAllCourses(filters: { title?: string; level?: string; price?: string; category?: string }) {
    const { title, level, price, category } = filters;
    const whereClause: any = { status: 'PUBLISHED' };

    if (title) whereClause.title = { contains: title };
    if (level) whereClause.level = level;
    if (price === 'free') whereClause.price = 0;
    if (category && category !== "") {
    whereClause.categoryId = category; 
  }
    
    else if (price === 'paid') whereClause.price = { gt: 0 };

    return await models.course.findMany({
      where: whereClause,
      select: {
        id: true, title: true, thumbnailUrl: true, price: true, 
        discountPrice: true, level: true, durationValue: true, 
        durationUnit: true, startDate: true,categoryId: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getUpcomingCourses() {
    return await models.course.findMany({
      where: {
        status: 'PUBLISHED',
        startDate: { gt: new Date() }
      },
      orderBy: { startDate: 'asc' },
      take: 6,
      select: {
        id: true, title: true, thumbnailUrl: true, price: true, 
        discountPrice: true, level: true, durationValue: true, 
        durationUnit: true, startDate: true,
      }
    });
  }

  static async getCourseDetail(id: string) {
    return await models.course.findUnique({
      where: { id },
      include: {
        subjects: {
          orderBy: { sortOrder: 'asc' },
          include: {
            chapters: { orderBy: { sortOrder: 'asc' } }
          }
        }
      }
    });
  }
}