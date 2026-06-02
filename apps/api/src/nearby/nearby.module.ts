import { Module } from '@nestjs/common'
import { NearbyController } from './nearby.controller.js'
import { NearbyService } from './nearby.service.js'

@Module({
  controllers: [NearbyController],
  providers: [NearbyService],
})
export class NearbyModule {}
