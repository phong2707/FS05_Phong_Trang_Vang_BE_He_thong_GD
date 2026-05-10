import { AuthController, ProfileController } from "@controllers";
import { action, RailsRoute } from "ts-rails";

export class ProfileRoute extends RailsRoute {
  public draw() {
    // Trong AuthRoute.draw()
    this.get("/me", action(AuthController, "me"));      // Để lấy profile
    this.put("/me", action(AuthController, "updateProfile")); // Để lưu profile
  }
}
