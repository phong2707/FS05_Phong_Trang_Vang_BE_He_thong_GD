import { RailsRoute, action } from "ts-rails";
import { ClassGroupController } from "@controllers/classGroup.controller";
import { ClassGroupUserController } from "@controllers/classGroupUser.controller";

export class ClassGroupRoute extends RailsRoute {
  public draw() {
    // ===== CLASS GROUP =====
    this.get("/", action(ClassGroupController, "index"));
    this.post("/", action(ClassGroupController, "createClassGroup"));
    this.put("/:id", action(ClassGroupController, "updateClassGroup"));
    this.delete("/:id", action(ClassGroupController, "deleteClassGroup"));

    // ===== STUDENTS IN CLASS GROUP =====
    this.get(
      "/:classGroupId/students",
      action(ClassGroupUserController, "listStudents")
    );

    this.post(
      "/:classGroupId/students",
      action(ClassGroupUserController, "addStudent")
    );

    this.delete(
      "/:classGroupId/students/:studentId",
      action(ClassGroupUserController, "removeStudent")
    );
  }
}
``
