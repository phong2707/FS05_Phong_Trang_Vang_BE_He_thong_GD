import { CourseController } from "@controllers";
import { RailsRoute, action } from "ts-rails";

export class CourseRoute extends RailsRoute {
  public draw() {
    this.get(
      "/:id",
      action(CourseController, "getCourseById"),
    );
  }
}