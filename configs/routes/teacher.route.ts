import { TeacherController } from "@controllers";
import { RailsRoute, action } from "ts-rails";

export class TeacherRoute extends RailsRoute {
  public draw() {
    this.get("/courses", action(TeacherController, "getAssignedCourses"));
  }
}
