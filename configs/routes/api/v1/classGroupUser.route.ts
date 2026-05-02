import { RailsRoute, action } from "ts-rails";
import { ClassGroupUserController } from "@controllers/classGroupUser.controller";

export class ClassGroupUserRoute extends RailsRoute {
  public draw() {
    this.post("/", action(ClassGroupUserController, "addStudent"));
    this.get("/", action(ClassGroupUserController, "listStudents"));
    this.delete(
      ":studentId",
      action(ClassGroupUserController, "removeStudent")
    );
  }
}