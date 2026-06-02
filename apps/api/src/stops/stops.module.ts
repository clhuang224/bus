import { Module } from '@nestjs/common'
import { StopsController } from './stops.controller.js'
import { StopsService } from './stops.service.js'

@Module({
  controllers: [StopsController],
  providers: [StopsService],
})
export class StopsModule {}
