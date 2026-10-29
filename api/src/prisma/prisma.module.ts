import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() means every other module can use PrismaService
// without importing PrismaModule again
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
