import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class VerifyCodeDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '123456' })
  code: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'user' })
  role: string;
}

