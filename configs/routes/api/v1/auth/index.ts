/**
 * Auth routes - controller dùng params.permit().
 */
import { AuthController } from "@controllers";
import { AuthController as ApiAuthController } from "@controllers";
import {
  GoogleVerifyValidator,
  RefreshTokenValidator,
  LoginValidator,
} from "@validators/auth.validator";
import { action, RailsRoute } from "ts-rails";

export class AuthRoute extends RailsRoute {
  public draw() {
    this.post("/login", action(AuthController, "login"), {
      document: {
        summary: "Login",
        tags: ["Auth"],
        body: LoginValidator,
        responses: {
          200: "Success",
          401: "Unauthorized",
          403: "Forbidden",
          410: "Account deleted",
          422: "Validation failed",
        },
      },
    });

    this.post("/refresh-token", action(ApiAuthController, "refreshToken"), {
      document: {
        summary: "Refresh token",
        tags: ["Auth"],
        body: RefreshTokenValidator,
        responses: {
          200: "Success",
          401: "Invalid token",
          422: "Validation failed",
        },
      },
    });

    this.post("/google/verify", action(ApiAuthController, "googleVerify"), {
      document: {
        summary: "Verify Google ID token",
        tags: ["Auth"],
        body: GoogleVerifyValidator,
        responses: {
          200: "Success",
          401: "Invalid token",
          422: "Validation failed",
        },
      },
    });  
  }
}
