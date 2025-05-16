import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class SignInDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
  
  @IsString()
  @IsNotEmpty()
  role: string;
}

// TODO: an enum for role


