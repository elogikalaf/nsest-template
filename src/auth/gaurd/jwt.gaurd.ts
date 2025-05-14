import { AuthGuard } from "@nestjs/passport";

export class jwtGaurd extends AuthGuard('jwt') {
  constructor() {
    super();
  }
}
