import { ForbiddenException, HttpStatus, Injectable } from "@nestjs/common"
import { PrismaService } from "src/prisma/prisma.service"
import * as argon from 'argon2';
import { RegisterDto, SignInDto } from "./dto";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { ResponseSuccessModel } from "src/utils/responseSuccessModel.model";
import { ResponseFailureModel } from "src/utils/responseFailureModel.model";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService) { }

  async signIn(dto: SignInDto) {
    try {
      const { email, password, role } = dto;

      const table = role === 'user' ? 'User' : 'Developer';

      const user = await this.prisma[table].findUnique({
        where: {
          email: email,
        },
      });

      if (!user) {
        const failureResponse = new ResponseFailureModel(
          HttpStatus.FORBIDDEN,
          null,
          'Credentials incorrect',
        );
        return failureResponse;
      }

      const pwMatches = await argon.verify(user.password, password);
      if (!pwMatches) {
        const failureResponse = new ResponseFailureModel(
          HttpStatus.FORBIDDEN,
          null,
          'Credentials incorrect',
        );
        return failureResponse;
      }

      const userWithoutPassword = { ...user, password: undefined };

      const token = await this.signToken(user.id, user.email);
      const successResponse = new ResponseSuccessModel(
        HttpStatus.OK,
        { userWithoutPassword, token: token },
        'User logged in successfully',
      );
      return successResponse;
    } catch (error) {
      const failureResponse = new ResponseFailureModel(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message,
        'Something went wrong',
      );
      return failureResponse;
    }
  }



  async register(dto: RegisterDto) {
    try {
      const { email, password, role } = dto;

      const table = role === 'user' ? 'User' : 'Developer';
      const hash = await argon.hash(password);

      const user = await this.prisma[table].create({
        data: {
          email: email,
          password: hash
        },
      });
      if (!user) {
        const failureResponse = new ResponseFailureModel(
          HttpStatus.INTERNAL_SERVER_ERROR,
          null,
          'something went wrong',
        );
        return failureResponse;
      }

      const userWithoutPassword = { ...user, password };
      const token = await this.signToken(user.id, user.email);
      const successResponse = new ResponseSuccessModel(
        HttpStatus.OK,
        { userWithoutPassword, token: token },
        'User logged in successfully',
      );
      return successResponse;
    } catch (error) {
      if (error.code === 'P2002') {
        const failureResponse = new ResponseFailureModel(
          HttpStatus.FORBIDDEN,
          error,
          'Email already exists',
        );
        return failureResponse;
      }

      const failureResponse = new ResponseFailureModel(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message,
        'Something went wrong',
      );
      return failureResponse;
    }
  }


  async signToken(userId: number, email: string) {
    const payload = {
      id: userId,
      email
    }
    return await this.jwt.signAsync(payload, {
      expiresIn: '30d',
      secret: this.config.get("JWT_SECRET")
    })

  }
}
