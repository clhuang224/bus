import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module.js'
import { TdxModule } from '../tdx/tdx.module.js'
import { RealtimeController } from './realtime.controller.js'
import { RealtimeService } from './realtime.service.js'
import { TdxRealtimeClientService } from './tdx-realtime-client.service.js'

@Module({
  imports: [PrismaModule, TdxModule],
  controllers: [RealtimeController],
  providers: [RealtimeService, TdxRealtimeClientService],
})
export class RealtimeModule {}
