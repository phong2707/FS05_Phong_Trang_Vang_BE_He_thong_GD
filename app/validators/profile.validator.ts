import { IsOptional, IsString } from "class-validator";

export class UpdateProfileValidator {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  // Bắt buộc phải thêm trường này vì Frontend đang gửi lên
  @IsOptional()
  @IsString()
  middleName?: string; 

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  gender?: string;
}