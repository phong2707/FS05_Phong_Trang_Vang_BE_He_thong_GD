import { FlashType } from "@configs/enum";
import env from "@configs/env";
import { Prisma } from "@db";
import { generateToken, verifyToken } from "@lib";
import { UserMailer } from "@mailers";
import models, { PasswordType, UserStatus } from "@models";
import {
  CreatePasswordValidator,
  ForgotPasswordValidator,
  LoginValidator,
  ResetPasswordValidator,
  UpdatePasswordValidator,
  VerifyOtpValidator,
} from "@validators/auth.validator";
import { UpdateProfileValidator } from "@validators/profile.validator";
import axios from "axios";
import { Security } from "ts-rails";
import { ApplicationController } from ".";

export type GoogleUser = {
  email: string;
  family_name: string;
  given_name: string;
  id: string;
  name: string;
  picture: string;
  verified_email: boolean;
};

export class AuthController extends ApplicationController {
  [x: string]: any;
  async loginWithGoogle() {
    this.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.googleClientId}&redirect_uri=${env.googleRedirectUri}&response_type=code&scope=profile email`,
    );
  }

  async loginWithGoogleRedirect() {
    const { code } = this.req.query;
    const {
      data: { access_token },
    } = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      code,
      redirect_uri: env.googleRedirectUri,
      grant_type: "authorization_code",
    });

    const { data: googleUser } = (await axios.get(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    )) as { data: GoogleUser };

    const loginUser = await models.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!loginUser) {
      const newUser = await models.user.create({
        data: {
          firstName: googleUser.given_name,
          lastName: googleUser.family_name,
          email: googleUser.email,
          avatarUrl: googleUser.picture,
          googleId: googleUser.id,
        },
      });
      this.req.session!.userId = newUser.id;
      this.req.session!.save((err) => {
        // Nếu anh muốn dùng Token thay vì Session, anh có thể trả về JSON tại đây
        // const tokens = this.generateAuthTokens(newUser.id);
        if (err) return this.redirect("/auth");
        this.flash(FlashType.Success, { msg: this.t("flash.login_success") });
        this.redirect("/");
      });
      return;
    }
    if (loginUser.deleted) {
      this.flash(FlashType.Errors, { msg: this.t("flash.user_deleted") });
      return this.redirect("/auth");
    }
    if (loginUser.status === UserStatus.INACTIVE) {
      this.flash(FlashType.Errors, { msg: "User is banned." });
      return this.redirect("/auth");
    }
    if (loginUser.status === UserStatus.PENDING) {
      this.flash(FlashType.Errors, {
        msg: this.t("flash.admin_reviewing_full"),
      });
      return this.redirect("/auth");
    }

    await models.user.update({
      where: { id: loginUser.id },
      data: {
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        email: googleUser.email,
        avatarUrl: googleUser.picture,
        googleId: loginUser.googleId ? loginUser.googleId : googleUser.id,
      },
    });
    this.req.session!.userId = loginUser.id;

    // const tokens = this.generateAuthTokens(loginUser.id);

    this.req.session!.save((err) => {
      if (err) return this.redirect("/auth");
      this.flash(FlashType.Success, { msg: this.t("flash.login_success") });
      this.redirect("/");
    });
  }

  async index() {
    this.logoutUser();
    this.render("auth.view/index");
  }

  async login() {
    const { email, password } = await this.params(LoginValidator).permit(
      "email",
      "password",
    );

    // ✅ Add timeout to prevent database queries from hanging
    const executeWithTimeout = async <T>(
      promise: Promise<T>,
      timeoutMs: number = 10000,
    ): Promise<T> => {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Database operation timeout")), timeoutMs),
      );
      return Promise.race([promise, timeoutPromise]);
    };

    try {
      // Kiểm tra email có trong DB không (không cần kiểm tra status ở lần này)
      const userForCheck = await executeWithTimeout(
        models.user.findFirst({
          where: { email },
          select: { id: true, status: true, deleted: true },
        }),
      );

      // Kiểm tra user bị xóa
      if (userForCheck && userForCheck.deleted) {
        return this.res.status(410).json({
          success: false,
          message: "Tài khoản này đã bị xóa.",
        });
      }

      // Kiểm tra status PENDING (chờ admin phê duyệt)
      if (userForCheck && userForCheck.status === UserStatus.PENDING) {
        return this.res.status(403).json({
          success: false,
          message: "Tài khoản của bạn đang chờ Admin phê duyệt.",
        });
      }

      // Kiểm tra status INACTIVE (bị khóa/cấm)
      if (userForCheck && userForCheck.status === UserStatus.INACTIVE) {
        return this.res.status(403).json({
          success: false,
          message: "Tài khoản của bạn đã bị khóa.",
        });
      }

      // Lấy user với status ACTIVE, include passwords và roles
      const user = await executeWithTimeout(
        models.user.findFirst({
          where: {
            email,
            status: UserStatus.ACTIVE,
            deleted: false,
          },
          include: {
            passwords: {
              where: { deleted: false, type: PasswordType.PASSWORD },
              orderBy: { createdAt: Prisma.SortOrder.desc },
              take: 1,
            },
            roles: {
              include: {
                role: true,
              },
            },
          },
        }),
      );

      // Kiểm tra email không tồn tại hoặc không có password
      if (!user || user.passwords.length === 0) {
        return this.res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không chính xác.",
        });
      }

      // Kiểm tra mật khẩu
      const isPasswordValid = await Security.verifyPassword(
        password,
        user.passwords[0].password,
      );

      if (!isPasswordValid) {
        return this.res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không chính xác.",
        });
      }

      // Tạo JWT token
      const token = generateToken({ id: user.id, email: user.email });

      // Cập nhật lastLoginAt
      await executeWithTimeout(
        models.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        }),
      );

      // Trả về response JSON với user info và roles
      return this.res.json({
        success: true,
        message: "Đăng nhập thành công",
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          status: user.status,
          roles: user.roles.map((ur) => ({
            id: ur.role.id,
            code: ur.role.code,
            name: ur.role.name,
          })),
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Có lỗi xảy ra";
      return this.res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Lấy thông tin profile của user hiện tại (Me endpoint)
   * GET /auth/me
   * Requires: User phải đã login
   * Returns: { success: true, user: { id, email, firstName, lastName, avatarUrl, phoneNumber, address, status, roles: [...] } }
   */
  async me() {
    // Kiểm tra user đã login hay chưa
    if (!this.currentUser) {
      return this.res.status(401).json({
        success: false,
        error: this.t("flash.login_first"),
      });
    }

    try {
      // Query user với roles
      const user = await models.user.findUnique({
        where: { id: this.currentUser.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          middleName: true,
          avatarUrl: true,
          phoneNumber: true,
          address: true,
          gender: true,
          status: true,
          createdAt: true,
          roles: {
            select: {
              role: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Nếu user không tìm thấy (edge case)
      if (!user) {
        return this.res.status(404).json({
          success: false,
          error: this.t("flash.user_not_found"),
        });
      }

      // Trả về user info với roles
      return this.res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          middleName: user.middleName,
          fullName: `${user.firstName} ${user.lastName}`,
          avatarUrl: user.avatarUrl,
          phoneNumber: user.phoneNumber,
          address: user.address,
          gender: user.gender,
          status: user.status,
          createdAt: user.createdAt,
          roles: user.roles.map((ur) => ({
            id: ur.role.id,
            code: ur.role.code,
            name: ur.role.name,
          })),
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Lỗi server";
      return this.res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  // Thêm vào file AuthController.ts

  async updateProfile() {
    try {
      // 1. Kiểm tra đăng nhập
      if (!this.currentUser) {
        return this.res.status(401).json({
          success: false,
          error: this.t("flash.login_first"),
        });
      }

      // 2. Chỉ cần dùng permit để lấy dữ liệu đã được validate
      const data = await this.params(UpdateProfileValidator).permit(
        "firstName",
        "lastName",
        "middleName",
        "phoneNumber",
        "address",
        "gender",
        "avatarUrl"
      );

      // 3. Cập nhật vào DB
      const updatedUser = await models.user.update({
        where: { id: this.currentUser.id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          middleName: true,
          avatarUrl: true,
          phoneNumber: true,
          address: true,
          gender: true,
          status: true,
        }
      });

      return this.res.json({
        success: true,
        message: "Cập nhật hồ sơ thành công",
        user: updatedUser,
      });
    } catch (error: any) {
      // Trả về lỗi validation chi tiết nếu có
      return this.res.status(422).json({
        success: false,
        error: error.message || "Dữ liệu không hợp lệ",
      });
    }
  }

  async logout() {
    if (this.currentUser) {
      // Vô hiệu hóa refresh token nếu có
      await models.password.updateMany({
        where: { userId: this.currentUser.id, type: "REFRESH_TOKEN" },
        data: { deleted: true }
      });
    }
    this.logoutUser();
    return this.res.json({
      success: true,
      message: this.t("flash.logged_out")
    });
  }

async forgotPassword() {
    const { email } = await this.params(ForgotPasswordValidator).permit("email");
    const user = await models.user.findFirst({
      where: { email, status: UserStatus.ACTIVE, deleted: false }
    });
    if (!user) {
      return this.res.status(404).json({
        success: false,
        message: "Email không tồn tại trong hệ thống"
      });
    }

    // 1. Sinh OTP 6 số và Hash
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await Security.hashPassword(otp);

    // 2. Xóa OTP cũ và tạo mới trong Database
    await models.password.updateMany({
      where: { userId: user.id, type: "OTP" },
      data: { deleted: true }
    });

    await models.password.create({
      data: {
        userId: user.id,
        password: hashedOtp,
        type: "OTP"
      }
    });

    // 3. Gửi mail thực tế
    try {
      // Sử dụng UserMailer để gửi mã OTP. 
      // Bạn có thể tùy chỉnh nội dung hoặc dùng hàm passwordReset có sẵn.
      await UserMailer.passwordReset(user.email, otp);
      // Log ra console để bạn vẫn có thể kiểm tra nhanh trong terminal khi dev
      console.log(`\x1b[33m%s\x1b[0m`, `[SENT EMAIL OTP to ${user.email}]: ${otp}`);

      return this.res.json({
        success: true,
        message: "Mã xác thực đã được gửi tới email của bạn"
      });
    } catch (error) {
      // Xử lý trường hợp lỗi cấu hình SMTP hoặc lỗi mạng khi gửi mail
      console.error("Lỗi khi gửi email:", error);
      return this.res.status(500).json({
        success: false,
        message: "Không thể gửi email lúc này. Vui lòng thử lại sau."
      });
    }
  }

  async verifyOtp() {
    const { email, otp } = await this.params(VerifyOtpValidator).permit("email", "otp");
    const user = await models.user.findUnique({
      where: { email },
      include: {
        passwords: {
          where: { type: "OTP", deleted: false },
          orderBy: { createdAt: Prisma.SortOrder.desc },
          take: 1
        }
      }
    });

    if (!user || user.passwords.length === 0) {
      return this.res.status(400).json({ success: false, message: "Mã OTP đã hết hạn" });
    }

    const isValid = await Security.verifyPassword(otp, user.passwords[0].password);
    if (!isValid) {
      return this.res.status(400).json({ success: false, message: "Mã OTP không chính xác" });
    }

    // Vô hiệu hóa OTP sau khi dùng
    await models.password.update({ where: { id: user.passwords[0].id }, data: { deleted: true } });

    // Tạo resetToken ngắn hạn (15 phút)
    const resetToken = generateToken({ id: user.id, action: "RESET_PASSWORD" }, "15m");

    return this.res.json({ success: true, resetToken });
  }

  async resetPassword() {
    const { password, passwordConfirmation } = await this.params(ResetPasswordValidator).permit(
      "password", "passwordConfirmation"
    );

    const token = this.req.headers.authorization?.split(" ")[1];
    if (!token) return this.res.status(401).json({ success: false, message: "Thiếu token xác thực" });

    if (password !== passwordConfirmation) {
      return this.res.status(422).json({ success: false, message: "Mật khẩu xác nhận không khớp" });
    }

    try {
      const decoded = verifyToken(token);
      if (decoded.action !== "RESET_PASSWORD") throw new Error();

      await models.user.update({
        where: { id: decoded.id },
        data: {
          passwords: {
            updateMany: { where: { deleted: false }, data: { deleted: true } },
            create: {
              password: await Security.hashPassword(password),
              type: PasswordType.PASSWORD
            }
          }
        }
      });

      return this.res.json({ success: true, message: "Đổi mật khẩu thành công" });
    } catch (err) {
      return this.res.status(401).json({ success: false, message: "Phiên làm việc đã hết hạn" });
    }
  }

  // Change Password Page
  async new() {
    const email = this.req.params.id;
    if (this.req.user && email !== this.req.user.email) {
      this.logoutUser();
    }
    this.render("auth.view/new");
  }

  // Request send email to reset password
  async create() {
    const { email } = await this.params(CreatePasswordValidator).permit(
      "email",
    );

    const user = await models.user.findUnique({
      where: {
        email,
        status: UserStatus.ACTIVE,
        deleted: false,
      },
    });

    if (!user) {
      this.flash(FlashType.Errors, { msg: this.t("flash.user_not_found") });
      return this.render("auth.view/new");
    }

    // Tạo JWT token tạm thời có hiệu lực trong 15 phút
    const resetToken = generateToken({ id: user.id, email: user.email }, "15m");
    const protocol = this.req.protocol;
    const host = this.req.get("host");
    const baseUrl = env.appUrl || `${protocol}://${host}`;

    // Tạo link dẫn tới trang reset password trên Frontend
    const resetLink = `${baseUrl}/auth/${encodeURIComponent(user.email)}/edit?token=${resetToken}`;

    // Gửi email cho người dùng
    await UserMailer.passwordReset(user.email, resetLink);

    this.flash(FlashType.Success, { msg: this.t("flash.reset_password_sent") });
    return this.redirect("/auth");
  }

  async edit() {
    const email = this.req.params.id;
    const token = this.req.query.token as string;

    if (this.req.user && email !== this.req.user.email) {
      this.logoutUser();
    }

    if (!token && !this.req.user) {
      this.flash(FlashType.Errors, {
        msg: this.t("flash.first_time_password"),
      });
      return this.redirect("/auth");
    }

    let isFirstTimeCreatePassword = false;
    if (!this.req.user || !this.req.session!.userId) {
      try {
        const decoded = verifyToken(token);
        if (decoded.email !== email) {
          this.flash(FlashType.Errors, { msg: this.t("flash.user_not_found") });
          return this.redirect("/auth");
        }
        const user = await models.user.findUnique({
          where: {
            id: decoded.id,
            email,
            status: UserStatus.ACTIVE,
            deleted: false,
          },
          select: { passwords: true },
        });

        if (!user) {
          this.flash(FlashType.Errors, { msg: this.t("flash.user_not_found") });
          return this.redirect("/auth");
        }
      } catch {
        this.flash(FlashType.Errors, { msg: this.t("flash.user_not_found") });
        return this.redirect("/auth");
      }
    } else {
      const currentPassword = await models.password.findFirst({
        where: {
          userId: this.req.user!.id,
          deleted: false,
        },
      });
      isFirstTimeCreatePassword = !currentPassword;
    }

    this.render("auth.view/edit", {
      email,
      token,
      isFirstTimeCreatePassword,
    });
  }

  async update() {
    const { password, passwordConfirmation, oldPassword, token } =
      await this.params(UpdatePasswordValidator).permit(
        "password",
        "passwordConfirmation",
        "oldPassword",
        "token",
      );
    const email = this.req.params.id;

    // Phải có hoặc oldPassword (đang logged in) hoặc token (quên mật khẩu)
    if (!oldPassword && !token) {
      this.flash(FlashType.Errors, {
        msg: this.t("flash.first_time_password"),
      });
      return this.redirect("/auth");
    }

    const user = await models.user.findUnique({
      where: {
        email,
        status: UserStatus.ACTIVE,
        deleted: false,
      },
    });

    if (!user) {
      this.flash(FlashType.Errors, { msg: this.t("flash.user_not_found") });
      return this.redirect(`/auth/${email}/edit`);
    }

    if (token) {
      // Verify token và kiểm tra tính hợp lệ của User ID
      try {
        const decoded = verifyToken(token);
        if (decoded.id !== user.id) throw new Error("User mismatch");
      } catch (err) {
        this.flash(FlashType.Errors, { msg: this.t("flash.invalid_token") });
        return this.redirect(`/auth/${email}/edit?token=${token}`);
      }
    } else if (oldPassword) {
      const currentPwd = await models.password.findFirst({
        where: { userId: user.id, deleted: false },
      });
      const isMatch = currentPwd
        ? await Security.verifyPassword(
          oldPassword as string,
          currentPwd.password,
        )
        : false;

      if (!isMatch) {
        this.flash(FlashType.Errors, { msg: this.t("flash.user_not_found") });
        return this.redirect(`/auth/${email}/edit`);
      }
    } else {
      this.flash(FlashType.Errors, { msg: this.t("flash.input_old_password") });
      return this.redirect(`/auth/${email}/edit`);
    }

    if (
      !password ||
      !passwordConfirmation ||
      password !== passwordConfirmation
    ) {
      this.flash(FlashType.Errors, { msg: this.t("flash.password_mismatch") });
      return this.redirect(`/auth/${email}/edit`);
    }

    await models.user.update({
      where: { id: user.id },
      data: {
        passwords: {
          updateMany: {
            where: { deleted: false },
            data: { deleted: true },
          },
          create: {
            password: await Security.hashPassword(password),
          },
        },
      },
    });

    this.flash(FlashType.Success, {
      msg: this.t("flash.password_changed_relogin"),
    });
    this.redirect("/auth");
  }

  // Thêm vào trong class AuthController
  async changePassword() {
    try {
      // 1. Kiểm tra đăng nhập
      if (!this.currentUser) {
        return this.res.status(401).json({ success: false, message: "Vui lòng đăng nhập" });
      }

      // 2. Lấy và validate dữ liệu
      const { oldPassword, password, passwordConfirmation } = await this.params(UpdatePasswordValidator).permit(
        "oldPassword", "password", "passwordConfirmation"
      );

      // 3. Kiểm tra mật khẩu cũ trong DB
      const currentPwd = await models.password.findFirst({
        where: { userId: this.currentUser.id, deleted: false, type: PasswordType.PASSWORD },
      });

      if (!currentPwd || !(await Security.verifyPassword(oldPassword, currentPwd.password))) {
        return this.res.status(400).json({ success: false, message: "Mật khẩu cũ không chính xác" });
      }

      // 4. Kiểm tra khớp mật khẩu mới
      if (password !== passwordConfirmation) {
        return this.res.status(422).json({ success: false, message: "Mật khẩu xác nhận không khớp" });
      }

      // 5. Cập nhật mật khẩu mới
      await models.user.update({
        where: { id: this.currentUser.id },
        data: {
          passwords: {
            updateMany: { where: { deleted: false }, data: { deleted: true } },
            create: {
              password: await Security.hashPassword(password),
              type: PasswordType.PASSWORD
            }
          }
        }
      });

      return this.res.json({ success: true, message: "Đổi mật khẩu thành công" });
    } catch (error: any) {
      return this.res.status(500).json({ success: false, message: error.message });
    }
  }

  destroy() {
    this.logoutUser();
    this.flash(FlashType.Info, { msg: this.t("flash.logged_out") });
    this.redirect("/auth");
  }
}
