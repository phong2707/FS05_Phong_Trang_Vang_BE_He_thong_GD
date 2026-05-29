import { RailsRoute } from "ts-rails";
import { ApiV1AdminFeatureRoute } from "./feature.route";
import { ApiV1AdminRoleRoute } from "./role.route";
import { ApiV1AdminUserRoute } from "./user.route";
import { ApiV1AdminEnrollmentRoute } from "./enrollment.route";

export class ApiV1AdminRoute extends RailsRoute {
  public draw() {
    this.path("/users", ApiV1AdminUserRoute.draw());
    this.path("/roles", ApiV1AdminRoleRoute.draw());
    this.path("/features", ApiV1AdminFeatureRoute.draw());
    this.path("/enrollments", ApiV1AdminEnrollmentRoute.draw());
  }
}
