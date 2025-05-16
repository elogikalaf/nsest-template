import { Body, Controller, Get, Logger, Post, Req, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto, SignInDto } from "./dto";
import { ApiBody, ApiOperation } from "@nestjs/swagger";
import { ResponseFailureModel } from "src/utils/responseFailureModel.model";
import { Request, Response } from "express";

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) { }

  @Post('registration')
  @ApiOperation({ summary: 'Register user' })
  @ApiBody({ type: RegisterDto })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const result = await this.authService.register(registerDto);
    if (result instanceof ResponseFailureModel) {
      return res.status(result.status).json(result);
    }
    return res.status(201).json(result);
  }


  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: SignInDto })
  @Post('login')
  async login(
    @Body() signInDto: SignInDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.authService.signIn(signInDto);
    if (result instanceof ResponseFailureModel) {
      return res.status(result.status).json(result);
    }
    return res.status(200).json(result);
  }



}
