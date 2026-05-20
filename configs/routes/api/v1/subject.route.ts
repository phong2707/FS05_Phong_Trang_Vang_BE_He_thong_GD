import { RailsRoute, action } from "ts-rails";
import { SubjectController } from "@controllers/subject.controller";

export class SubjectRoute extends RailsRoute {
  public draw() {
    this.get("/", action(SubjectController, "index"));
    this.get("/:id", action(SubjectController, "show"));
  }
}
