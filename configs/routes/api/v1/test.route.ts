import { RailsRoute, action } from "ts-rails";
import { TestController } from "@controllers/test.controller";

export class TestRoute extends RailsRoute {
  public draw() {

    // ✅ CREATE test
    this.post("/chapters/:chapterId/tests", action(TestController, "create"));
    this.post("/subjects/:subjectId/tests", action(TestController, "create"));
    this.post("/courses/:courseId/tests", action(TestController, "create"));

    // ✅ LIST theo chapter
    this.get(
      "/chapters/:chapterId/tests",
      action(TestController, "listByChapter")
    );

    // ✅ LIST theo subject
    this.get(
      "/subjects/:subjectId/tests",
      action(TestController, "listBySubject")
    );

    // ✅ LIST theo course
    this.get(
      "/courses/:courseId/tests",
      action(TestController, "listByCourse")
    );

    // ✅ DETAIL
    this.get("/tests/:id", action(TestController, "show"));

    // ✅ SUBMIT
    this.post("/tests/submit", action(TestController, "submit"));
//generate
    this.post("/tests/generate",action(TestController, "generateTest"));

    this.post("/tests/start", action(TestController, "startTest"));

    this.get("/tests/:id/leaderboard", action(TestController, "leaderboard"));
  }
}