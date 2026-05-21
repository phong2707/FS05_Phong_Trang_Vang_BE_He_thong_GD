import { RailsRoute, action } from "ts-rails";
import { TaskmanController } from "@controllers/taskman.controller";

export class TaskmanRoute extends RailsRoute {
  public draw() {
    // PUBLIC
    this.get("/chapters/:chapterId/resources", action(TaskmanController, "list"));
    this.get("/subjects/:subjectId/resources", action(TaskmanController, "listBySubject"));

    // PROTECTED (Sẽ được bảo vệ từ bên trong Controller)
    this.post("/chapters/:chapterId/resources/link", action(TaskmanController, "createLink"));
    this.post("/chapters/:chapterId/resources/file", action(TaskmanController, "createFile"));
    this.put("/resources/:id", action(TaskmanController, "update"));
    this.put("/resources/:id/visibility", action(TaskmanController, "toggleVisibility"));
    this.put("/resources/reorder", action(TaskmanController, "reorder"));
    this.delete("/resources/:id", action(TaskmanController, "delete"));
  }
}