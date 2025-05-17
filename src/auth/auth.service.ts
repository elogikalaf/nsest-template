import { ForbiddenException, HttpStatus, Injectable } from "@nestjs/common"
import { PrismaService } from "src/prisma/prisma.service"
import * as argon from 'argon2';
import { RegisterDto, SignInDto } from "./dto";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { ResponseSuccessModel } from "src/utils/responseSuccessModel.model";
import { ResponseFailureModel } from "src/utils/responseFailureModel.model";
import { VerifyCodeDto } from "./dto/verify-code.dto";
import { Verify } from "node:crypto";
import { VerifyCode } from "@prisma/client";

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
        { user: userWithoutPassword, token: token },
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

      const userWithoutPassword = { ...user, password: undefined };

      const token = await this.signToken(user.id, user.email);

      const verifyCode = await this.createVerifyCode(user.id.toString(), role);

      const successResponse = new ResponseSuccessModel(
        HttpStatus.OK,
        { user: userWithoutPassword, token: token, code: verifyCode.code },
        'User logged in successfully',
      );
      // set firstLogin to false 
      await this.prisma[table].update({
        where: {
          id: user.id,
        },
        data: {
          isFirstLogin: false,
        },
      });
      return successResponse;
    } catch (error) {
      console.log(error);
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

  async vertifyCode(verifyCodeDto: VerifyCodeDto) {
    try {
      const { code, role } = verifyCodeDto;

      const table = role === 'user' ? 'User' : 'Developer';

      const tokenRecord = await this.prisma.verifyCode.findUnique({
        where: {
          code
        },
      });

      if (!tokenRecord) {
        const failureResponse = new ResponseFailureModel(
          HttpStatus.FORBIDDEN,
          null,
          'Invalid token',
        );
        return failureResponse;
      }

      const userId = tokenRecord.userId ? tokenRecord.userId : tokenRecord.developerId;

      if (new Date(Date.now()) > tokenRecord.expiresAt) {
        const failureResponse = new ResponseFailureModel(
          HttpStatus.FORBIDDEN,
          null,
          'Token expired',
        );
        return failureResponse;
      }

      // Delete all user tokens after successful verification
      await this.prisma.verifyCode.delete({
        where: {
          userId: userId,
        },
      });

      // update the user record and set isVerified to true
      const updatedUser = await this.prisma[table].update({
        where: {
          id: userId
        },
        data: {
          isVerified: true
        }
      })

      const updateUserWithoutPassword = { ...updatedUser, passsword: undefined }


      const successResponse = new ResponseSuccessModel(
        HttpStatus.OK,
        updateUserWithoutPassword,
        'Password reset successful',
      );
      return successResponse;
    } catch (error) {
      const failureResponse = new ResponseFailureModel(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
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

  async createVerifyCode(userId: string, role: string) {
      let code: string;
      let existingCode: VerifyCode | null;

      do {
        code = Math.floor(100000 + Math.random() * 900000).toString();
        existingCode = await this.prisma.verifyCode.findUnique({
          where: { code },
        });
      } while (existingCode);

      const verifyCode = await this.prisma.verifyCode.create({
        data: {
          code,
          userId: userId,
          expiresAt: new Date(Date.now() + 1000 * 60 * 5),
        },
      });
    return verifyCode;


  }
}
