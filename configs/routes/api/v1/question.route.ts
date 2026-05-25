import { RailsRoute, action } from "ts-rails";
import { QuestionController } from "@controllers/question.controller";

export class QuestionRoute extends RailsRoute {
  public draw() {

    // ✅ LIST
    this.get(
      "/questions",
      action(QuestionController, "list")
    );

    // ✅ Question types
    this.get(
      "/question-types",
      action(QuestionController, "types")
    );

    // ✅ SHOW
    this.get(
      "/questions/:id",
      action(QuestionController, "show")
    );

    // ✅ CREATE
    this.post(
      "/questions",
      action(QuestionController, "create")
    );

    // ✅ UPDATE
    this.put(
      "/questions/:id",
      action(QuestionController, "update")
    );

    // ✅ DELETE
    this.delete(
      "/questions/:id",
      action(QuestionController, "delete")
    );
  }
}