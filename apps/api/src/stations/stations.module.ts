import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module.js'
import { StationsController } from './stations.controller.js'
import { StationsService } from './stations.service.js'

@Module({
  imports: [PrismaModule],
  controllers: [StationsController],
  providers: [StationsService],
})
export class StationsModule {}
