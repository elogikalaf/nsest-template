import { ForbiddenException, Injectable } from "@nestjs/common"
import { PrismaService } from "src/prisma/prisma.service"
import * as argon from 'argon2';
import { registerDto } from "./dto";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService) { }
  async signIn(dto: registerDto) {
    const { email, password } = dto;
    const user = await this.prisma.user.findUnique({
      where: {
        email: email
      }
    })
    if (!user) {
      throw new ForbiddenException('Credentials incorrect');
    }

    const pwMatches = await argon.verify(user.password, password);
    if (!pwMatches) {
      throw new ForbiddenException('Credentials incorrect');
    }
    delete user.password;
    const token = await this.signToken(user.id, user.email);
    return { token }
  }


  async signUp(dto: registerDto) {
    try {
      const { email, password } = dto;
      const hash = await argon.hash(password);

      const user = await this.prisma.user.create({
        data: {
          email: email,
          password: hash
        },
      });
      delete user.password;

      const token = await this.signToken(user.id, user.email);
      return { token }
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Email already exists');
        }
        throw error;
      }
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
