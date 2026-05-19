import { CategoryService } from "@services/category.service"; 
import { ApplicationController } from "./application.controller";

export class CategoryController extends ApplicationController {
  async listCategories() {
    try {
      const categories = await CategoryService.getAllCategories();
      return this.res.status(200).json(categories);
    } catch (error: any) {
      return this.res.status(500).json({ message: "Lỗi lấy danh mục", error: error.message });
    }
  }
}