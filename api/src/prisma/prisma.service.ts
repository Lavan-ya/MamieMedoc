import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // Connect to the database when the app starts
  async onModuleInit() {
    await this.$connect();
  }
}
