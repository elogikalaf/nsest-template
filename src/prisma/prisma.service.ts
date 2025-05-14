import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient { // prisma client is the class that can connect to the db and do stuff, here we extend it to configure it for our own use
  constructor(private readonly config: ConfigService) {
    super({ // using the PrismaClient constructor by calling super
      datasources: {
        db: {
          url: config.get("DATABASE_URL")
        }
      }
    })
  }
}

