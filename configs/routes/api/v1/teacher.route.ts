import { RailsRoute, action } from "ts-rails";
import { TeacherController } from "@controllers";

export class TeacherRoute extends RailsRoute {
  public draw() {
    this.get("/subjects", action(TeacherController, "getAssignedSubjects"));
  }
}