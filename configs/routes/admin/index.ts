import { Feature } from "@configs/enum";
import { AdminController, AdminUserController } from "@controllers";
import { action, RailsRoute, RestActions } from "ts-rails";
import { AdminFeatureRoute } from "./adminFeature.route";
import { AdminProfileRoute } from "./adminProfile.route";
import { AdminRoleRoute } from "./adminRole.route";
import { AdminUserRoute } from "./adminUser.route";
import { AdminCourseRoute } from "./adminCourse.route";
import { RevenueRoute } from "./revenue.route";

export class AdminRoute extends RailsRoute {
  public draw() {
    this.path("/me", AdminProfileRoute.draw());
    this.path("/users/stats", action(AdminUserController, "stats"));
    this.path("/users", AdminUserRoute.draw());
    this.path("/roles", AdminRoleRoute.draw());
    this.path("/features", AdminFeatureRoute.draw());
    this.path("/courses", AdminCourseRoute.draw());
    this.path("/revenue", RevenueRoute.draw());

    this.resource(AdminController, {
      only: [RestActions.Index],
      setPermissionForAny: [
        Feature.AdministrationManagement,
        Feature.UserManagement,
      ],
    });
  }
}
