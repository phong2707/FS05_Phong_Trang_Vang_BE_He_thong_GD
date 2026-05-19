import { RailsRoute, action } from "ts-rails";
import { TaskmanController } from "@controllers/taskman.controller";

export class TaskmanRoute extends RailsRoute {
  public draw() {

    // ✅ LIST resource theo chapter
    this.get(
      "/chapters/:chapterId/resources",
      action(TaskmanController, "list")
    );

    // ✅ CREATE link
    this.post(
      "/chapters/:chapterId/resources/link",
      action(TaskmanController, "createLink")
    );

    // ✅ CREATE file
    this.post(
      "/chapters/:chapterId/resources/file",
      action(TaskmanController, "createFile")
    );

    // ✅ UPDATE
    this.put(
      "/resources/:id",
      action(TaskmanController, "update")
    );

    // ✅ toggle visibility
    this.put(
      "/resources/:id/visibility",
      action(TaskmanController, "toggleVisibility")
    );

    // ✅ DELETE
    this.delete(
      "/resources/:id",
      action(TaskmanController, "delete")
    );
  }
}