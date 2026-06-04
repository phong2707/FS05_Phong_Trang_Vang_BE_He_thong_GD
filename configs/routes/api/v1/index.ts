import env from "@configs/env";
import { MyPermissionController } from "@controllers/api";
import { ValidateUserLoginMiddleware } from "@middlewares";
import { action, RailsRoute } from "ts-rails";
import { ApiV1AdminRoute } from "./admin";
import { AuthRoute } from "./auth";
import { ApiV1DevRoute } from "./dev";
import { TeacherRoute } from "./teacher.route";
import { ClassGroupRoute } from "./classGroup.route";
import { TaskmanRoute } from "./taskman.route";
import { SubjectRoute } from "./subject.route";
import { QuestionRoute } from "./question.route";
import { TestRoute } from "./test.route";
import { AssignmentRoute } from "./assignment.route";
import { EnrollmentRoute } from "./enrollment.route";
import { StudentLearningRoute } from "../../studentLearning.route";

export class ApiV1Route extends RailsRoute {
  public draw() {
    if (env.nodeEnv === "development") {
      this.path("/dev", ApiV1DevRoute.draw());
    }

    this.path("/auth", AuthRoute.draw());

    // Public routes cho enrollment guest + VNPay callbacks
    this.path("/payments", EnrollmentRoute.draw());
    this.path("/enrollments", EnrollmentRoute.draw());

    // Public routes (if needed for testing)
    this.path("/teacher", TeacherRoute.draw());
    this.path("/class-groups", ClassGroupRoute.draw());

    // Protected routes
    this.path(action(ValidateUserLoginMiddleware));
    this.path("/teachers", TeacherRoute.draw());
    this.path("/subjects", SubjectRoute.draw());
    this.path("/class-groups", ClassGroupRoute.draw());
    this.path("/", TaskmanRoute.draw());
    this.path("/", QuestionRoute.draw());
    this.path("/", TestRoute.draw());
    this.path("/", AssignmentRoute.draw());
    this.path("/student", StudentLearningRoute.draw());

    // Permission routes
    this.get("/permissions/me", action(MyPermissionController, "index"));

    // Admin routes
    this.path("/admin", ApiV1AdminRoute.draw());
  }
}
