import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'

@Global() // Make the module global so it doesn't need to be imported in every module
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
