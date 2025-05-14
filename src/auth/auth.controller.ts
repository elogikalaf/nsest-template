import { Body, Controller, Get, Logger, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { registerDto } from "./dto";

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) { }

  @Post('signup')
  signUp(@Body() dto: registerDto) {
    console.log({
      dto
    })
    return this.authService.signUp(dto);
  }

  @Post('signin')
  login(@Body() dto: registerDto) {
    return this.authService.signIn(dto);
  }
}
