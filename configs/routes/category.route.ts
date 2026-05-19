import { action, RailsRoute } from "ts-rails";
import { CategoryController } from "@controllers/categories.controller";

export class CategoryRoute extends RailsRoute {
  public draw() {
    // Route sẽ là /api/categories
    this.get("/", action(CategoryController, "listCategories"));
  }
}