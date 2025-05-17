import { HttpStatus, Injectable } from "@nestjs/common"
import { PrismaService } from "src/prisma/prisma.service"
import * as argon from 'argon2';
import { RegisterDto, SignInDto } from "./dto";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { ResponseSuccessModel } from "src/utils/responseSuccessModel.model";
import { ResponseFailureModel } from "src/utils/responseFailureModel.model";
import { VerifyCodeDto } from "./dto/verify-code.dto";
import { Verify } from "node:crypto";
import { Person, VerifyCode } from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService) { }

  async signIn(dto: SignInDto) {
    try {
      const { email, password, role } = dto;

      const person = await this.prisma.person.findUnique({
        where: {
          email: email,
        },
      });

      if (!person) {
        const failureResponse = new ResponseFailureModel(
          HttpStatus.FORBIDDEN,
          null,
          'Credentials incorrect',
        );
        return failureResponse;
      }

      const pwMatches = await argon.verify(person.password, password);
      if (!pwMatches) {
        const failureResponse = new ResponseFailureModel(
          HttpStatus.FORBIDDEN,
          null,
          'Credentials incorrect',
        );
        return failureResponse;
      }

      const { password: _, ...userWithoutPasswordWithRole } = person;


      const token = await this.signToken(person.id, person.email);
      const successResponse = new ResponseSuccessModel(
        HttpStatus.OK,
        {
          user:
          {
            ...userWithoutPasswordWithRole,
            role
          },
          token,
        },
        'User logged in successfully',
      );
      return successResponse;
    } catch (error) {
      console.log(error);
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

      const hash = await argon.hash(password);

      let person: Person;

      if (role == 'user') {
        // create person with an empty user record by joining
        person = await this.prisma.person.create({
          data: {
            email: email,
            password: hash,
            user: {
              create: {}
            }
          },
        });
      } else {
        // create person with an empty dev record by joining
        person = await this.prisma.person.create({
          data: {
            email: email,
            password: hash,
            developer: {
              create: {}
            }
          },
        });
      }
      if (!person) {
        console.log('error creating user');
        const failureResponse = new ResponseFailureModel(
          HttpStatus.INTERNAL_SERVER_ERROR,
          null,
          'something went wrong',
        );
        return failureResponse;
      }

      const { password: _, ...personWithoutPasswordWithRole } = person;

      const token = await this.signToken(person.id, person.email);

      const verifyCode = await this.createVerifyCode(person.id.toString());

      const successResponse = new ResponseSuccessModel(
        HttpStatus.OK,
        {
          user:
          {
            ...personWithoutPasswordWithRole,
            role
          },
          token,
          code: verifyCode.code
        },
        'User logged in successfully',
      );
      // set firstLogin to false 
      await this.prisma.person.update({
        where: {
          id: person.id,
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

  async vertifyCode(verifyCodeDto: VerifyCodeDto, personId: string) {
    try {
      const { code, role } = verifyCodeDto;

      const codeRecord = await this.prisma.verifyCode.findUnique({
        where: {
          code,
          personId
        },
      });

      if (!codeRecord) {
        const failureResponse = new ResponseFailureModel(
          HttpStatus.FORBIDDEN,
          null,
          'Invalid token',
        );
        return failureResponse;
      }


      if (new Date(Date.now()) > codeRecord.expiresAt) {
        const failureResponse = new ResponseFailureModel(
          HttpStatus.FORBIDDEN,
          null,
          'Token expired',
        );
        return failureResponse;
      }

      if (!personId) {
        console.log(personId)
      }
      // Delete all user tokens after successful verification
      await this.prisma.verifyCode.delete({
        where: {
          personId: personId
        },
      });

      // update the user record and set isVerified to true
      const updatedPerson = await this.prisma.person.update({
        where: {
          id: personId
        },
        data: {
          isVerified: true
        }
      })
      const { password, ...updatedPersonWithoutPassword } = updatedPerson;


      const successResponse = new ResponseSuccessModel(
        HttpStatus.OK,
        { user: updatedPersonWithoutPassword },
        'Verified successfully',
      );
      return successResponse;
    } catch (error) {
      console.log(error)
      const failureResponse = new ResponseFailureModel(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
        'Something went wrong',
      );
      return failureResponse;
    }
  }


  async signToken(userId: string, email: string) {
    const payload = {
      id: userId,
      email
    }
    return await this.jwt.signAsync(payload, {
      expiresIn: '30d',
      secret: this.config.get("JWT_SECRET")
    })
  }

  async resendCode(personId: string) {
    try {
      const person = await this.prisma.person.findUnique({
        where: {
          id: personId,
        },
      });

      if (!person) {
        const failureResponse = new ResponseFailureModel(
          HttpStatus.FORBIDDEN,
          null,
          'User not found',
        );
        return failureResponse;
      }

      const verifyCode = await this.prisma.verifyCode.findUnique({
        where: {
          personId
        },
      });

      const now = Date.now();

      if (verifyCode) {
        const codeSentTime = verifyCode.createdAt.getTime();
        const twoMinutes = 2 * 60 * 1000;

        if (now < codeSentTime + twoMinutes) {
          return new ResponseFailureModel(
            HttpStatus.FORBIDDEN,
            null,
            'Verification code already sent, please wait 2 minutes',
          );
        }

        // Delete old code
        await this.prisma.verifyCode.delete({ where: { personId } });
      }

      // create a new code
      const newVerifyCode = await this.createVerifyCode(personId);

      const successResponse = new ResponseSuccessModel(
        HttpStatus.OK,
        { code: newVerifyCode.code },
        'Verification code resent successfully',
      );
      return successResponse;
    } catch (error) {
      console.log(error)
      const failureResponse = new ResponseFailureModel(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
        'Something went wrong',
      );
      return failureResponse;
    }
  }

  async createVerifyCode(personId: string) {
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
        personId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 5),
      },
    });
    return verifyCode;


  }
}
