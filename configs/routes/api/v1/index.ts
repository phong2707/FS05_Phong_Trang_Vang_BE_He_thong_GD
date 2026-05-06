import env from "@configs/env";
import { MyPermissionController } from "@controllers/api";
import { ValidateUserLoginMiddleware } from "@middlewares";
import { action, RailsRoute } from "ts-rails";
import { ApiV1AdminRoute } from "./admin";
import { AuthRoute } from "./auth";
import { ApiV1DevRoute } from "./dev";

import { ClassGroupRoute } from "./classGroup.route";

import {TaskmanRoute} from "./taskman.route";


export class ApiV1Route extends RailsRoute {
  public draw() {
    if (env.nodeEnv === "development") {
      this.path("/dev", ApiV1DevRoute.draw());
    }

    this.path("/auth", AuthRoute.draw());

    this.path(action(ValidateUserLoginMiddleware));

    this.path("/class-groups", ClassGroupRoute.draw());

    this.path("/", TaskmanRoute.draw());

    // Permission routes - action(Controller, "index") tạo instance mới mỗi request
    this.get("/permissions/me", action(MyPermissionController, "index"));

    // Admin routes - yêu cầu AM permission
    this.path("/admin", ApiV1AdminRoute.draw());


  }
}
