import { ConfigService } from "@nestjs/config"
import { PassportStrategy } from "@nestjs/passport"
import { Strategy, ExtractJwt } from "passport-jwt"
import { Injectable } from "@nestjs/common"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get("JWT_SECRET")
    })
  }
  validate(payload) {
    console.log("payload: ", payload)
    return payload
  }
}

