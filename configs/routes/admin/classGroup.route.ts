import { ClassGroupController } from "@controllers/classGroup.controller";
import { action, RailsRoute } from "ts-rails";

export class ClassGroupRoute extends RailsRoute {
  public draw() {
    this.get("/", action(ClassGroupController, "index"), {
      setPermissionForAny: ["COURSE_VIEW", "COURSE_EDIT"],
    });

    this.get("/:id", action(ClassGroupController, "show"), {
      setPermissionForAny: ["COURSE_VIEW", "COURSE_EDIT"],
    });

    this.post("/", action(ClassGroupController, "createClassGroup"), {
      setPermissionForAny: ["COURSE_EDIT"],
    });

    this.patch("/:id", action(ClassGroupController, "updateClassGroup"), {
      setPermissionForAny: ["COURSE_EDIT"],
    });

    this.delete("/:id", action(ClassGroupController, "deleteClassGroup"), {
      setPermissionForAny: ["COURSE_EDIT"],
    });

    this.get("/:id/students", action(ClassGroupController, "students"), {
      setPermissionForAny: ["COURSE_VIEW", "COURSE_EDIT"],
    });

    this.post("/:id/students", action(ClassGroupController, "addStudents"), {
      setPermissionForAny: ["COURSE_EDIT"],
    });

    this.delete("/:id/students/:uid", action(ClassGroupController, "removeStudent"), {
      setPermissionForAny: ["COURSE_EDIT"],
    });

    this.get("/:id/teachers", action(ClassGroupController, "teachers"), {
      setPermissionForAny: ["COURSE_VIEW", "COURSE_EDIT"],
    });
  }
}
