import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: "test@gmail.com" })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: "passwordsafe$1" })
  password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: "user" })
  role: string;
}

// TODO: add an enum for role
