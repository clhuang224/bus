import { Module } from '@nestjs/common'
import { RealtimeController } from './realtime.controller.js'
import { RealtimeService } from './realtime.service.js'

@Module({
  controllers: [RealtimeController],
  providers: [RealtimeService],
})
export class RealtimeModule {}
