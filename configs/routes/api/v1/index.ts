import env from "@configs/env";
import { MyPermissionController } from "@controllers/api";
import { ValidateUserLoginMiddleware } from "@middlewares";
import { action, RailsRoute } from "ts-rails";
import { ApiV1AdminRoute } from "./admin";
import { AuthRoute } from "./auth";
import { ApiV1DevRoute } from "./dev";
import { TeacherRoute } from "../../teacher.route";
import { CourseRoute } from "../../course.route";


export class ApiV1Route extends RailsRoute {
  public draw() {
    if (env.nodeEnv === "development") {
      this.path("/dev", ApiV1DevRoute.draw());
    }

    this.path("/auth", AuthRoute.draw());

    // ✅ Teacher & Course (CHO PHÉP TEST KHÔNG LOGIN)
this.path("/teacher", TeacherRoute.draw());
this.path("/courses", CourseRoute.draw());

// ✅ TỪ ĐÂY TRỞ XUỐNG MỚI BẮT LOGIN
this.path(action(ValidateUserLoginMiddleware));


    this.path(action(ValidateUserLoginMiddleware));

    // Permission routes - action(Controller, "index") tạo instance mới mỗi request
    this.get("/permissions/me", action(MyPermissionController, "index"));

    // Admin routes - yêu cầu AM permission
    this.path("/admin", ApiV1AdminRoute.draw());
  }
}
