// Trong file category.service.ts
import models from "@models";

export class CategoryService {
  static async getAllCategories() {
    return await models.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });
  }
}