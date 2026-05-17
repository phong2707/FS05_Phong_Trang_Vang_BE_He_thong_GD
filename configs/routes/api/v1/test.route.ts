import { RailsRoute, action } from "ts-rails";
import { TestController } from "@controllers/test.controller";

export class TestRoute extends RailsRoute {
  public draw() {

    // ✅ tạo test
    this.post("/tests", action(TestController, "create"));

    // ✅ list theo subject
    this.get(
      "/subjects/:subjectId/tests",
      action(TestController, "list")
    );

    // ✅ chi tiết test
    this.get("/tests/:id", action(TestController, "show"));

    // ✅ submit
    this.post("/tests/submit", action(TestController, "submit"));
  }
}