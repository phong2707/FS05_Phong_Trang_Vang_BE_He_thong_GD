import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class LoginValidator {
  @IsNotEmpty({ message: "Email is required" })
  @IsEmail()
  email!: string;

  @IsNotEmpty({ message: "Password is required" })
  @IsString()
  @MinLength(1)
  password!: string;
}

export class CreatePasswordValidator {
  @IsNotEmpty({ message: "Email is required" })
  @IsEmail()
  email!: string;
}

export class UpdatePasswordValidator {
  @IsNotEmpty({ message: "Password is required" })
  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters" })
  password!: string;

  @IsNotEmpty({ message: "Password confirmation is required" })
  @IsString()
  passwordConfirmation!: string;

  @IsOptional()
  @IsString()
  oldPassword?: string;

  @IsOptional()
  @IsString()
  token?: string;
}

export class GoogleVerifyValidator {
  static schema = { idToken: "string" } as const;
  static required = ["idToken"] as const;

  @IsNotEmpty({ message: "Missing ID token" })
  @IsString()
  @MinLength(1)
  idToken!: string;
}

export class RefreshTokenValidator {
  static schema = { refreshToken: "string" } as const;
  static required = ["refreshToken"] as const;

  @IsNotEmpty({ message: "Missing refresh token" })
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}

export class ForgotPasswordValidator {
  @IsNotEmpty({ message: "Email là bắt buộc" })
  @IsEmail({}, { message: "Email không hợp lệ" })
  email!: string;
}

export class VerifyOtpValidator {
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty({ message: "Mã OTP là bắt buộc" })
  @IsString()
  @MinLength(6)
  otp!: string;
}

export class ResetPasswordValidator {
  @IsNotEmpty({ message: "Mật khẩu mới là bắt buộc" })
  @IsString()
  @MinLength(6)
  password!: string;

  @IsNotEmpty()
  @IsString()
  passwordConfirmation!: string;
}

