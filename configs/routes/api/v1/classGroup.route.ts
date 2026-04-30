import { RailsRoute, action } from "ts-rails";
import { ClassGroupController } from "@controllers/classGroup.controller";

export class ClassGroupRoute extends RailsRoute {
  public draw() {
    this.post("/", action(ClassGroupController, "createClassGroup"));
    this.put("/:id", action(ClassGroupController, "updateClassGroup"));
    this.delete("/:id", action(ClassGroupController, "deleteClassGroup"));
  }
}
