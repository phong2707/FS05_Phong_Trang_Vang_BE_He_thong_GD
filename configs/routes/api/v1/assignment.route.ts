import { RailsRoute, action } from "ts-rails";
import { AssignmentController } from "@controllers/assignment.controller";

export class AssignmentRoute extends RailsRoute {
  public draw() {

    // ✅ student upload
    this.post(
      "/assignments/submit",
      action(AssignmentController, "submit")
    );

    // ✅ teacher chấm
    this.post(
      "/assignments/:id/grade",
      action(AssignmentController, "grade")
    );

    // ✅ list submissions
    this.get(
      "/tests/:testId/submissions",
      action(AssignmentController, "list")
    );
  }
}