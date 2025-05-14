import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class registerDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
