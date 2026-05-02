  import { AuthController } from "@controllers";
  import { action, RailsRoute } from "ts-rails";

  export class AuthRoute extends RailsRoute {
    public draw() {
      this.get("/google", action(AuthController, "loginWithGoogle"));
      this.get(
        "/google/callback",
        action(AuthController, "loginWithGoogleRedirect"),
      );
      this.post("/login", action(AuthController, "login"));
      this.post("/logout", action(AuthController, "logout")); // Thêm nếu chưa có
      // Các route cho Quên mật khẩu
      this.post("/forgot-password", action(AuthController, "forgotPassword"));
      this.post("/verify-otp", action(AuthController, "verifyOtp"));
      this.post("/reset-password", action(AuthController, "resetPassword"));
      this.put("/change-password", action(AuthController, "changePassword"));
      this.get("/me", action(AuthController, "me"));
      this.put("/me", action(AuthController, "updateProfile"));
      this.resource(AuthController);
    }
  }

