import { action, RailsRoute } from "ts-rails";
import { CourseController } from "@controllers/course.controller";

export class CourseRoute extends RailsRoute {
  public draw() {
    // Lưu ý: Đặt route /upcoming TRƯỚC /:id để tránh xung đột params
    this.get("/upcoming", action(CourseController, "upcoming"));
    this.get("/:id", action(CourseController, "detail"));
    this.get("/", action(CourseController, "list"));
  }
}